const fetch = require('node-fetch')

const getTemplatesFromGitHub = async (token) => {
  const templates = await fetch(`https://api.github.com/orgs/netlify-templates/repos`, {
    method: 'GET',
    headers: {
      Authorization: `token ${token}`,
    },
  })
  const allTemplates = await templates.json()

  return allTemplates
}

const validateTemplate = async ({ ghToken, templateName }) => {
  const response = await fetch(`https://api.github.com/repos/${templateName}`, {
    headers: {
      Authorization: `token ${ghToken}`,
    },
  })

  if (response.status === 404) {
    return { exists: false }
  }

  if (!response.ok) {
    throw new Error(`Error fetching template ${templateName}: ${await response.text()}`)
  }

  const data = await response.json()
  return { exists: true, isTemplate: data.is_template }
}

const createRepo = async (templateName, ghToken, siteName) => {
  const resp = await fetch(`https://api.github.com/repos/${templateName}/generate`, {
    method: 'POST',
    headers: {
      Authorization: `token ${ghToken}`,
    },
    body: JSON.stringify({
      name: siteName,
    }),
  })

  const data = await resp.json()
  return data
}

/**
 * Retrieves information about the given repository.
 *
 * @param {string} ownerAndRepo The owner and repo name, e.g. "netlify-templates/kpop-stack"
 * @param {string} ghToken The GitHub token to use
 *
 * @returns {Promise<object>} The repository information.
 */
const getRepo = async (ownerAndRepo, ghToken) => {
  const response = await fetch(`https://api.github.com/repos/${ownerAndRepo}`, {
    method: 'GET',
    headers: {
      Authorization: `token ${ghToken}`,
    },
  })

  return await response.json()
}

module.exports = { getTemplatesFromGitHub, createRepo, validateTemplate, getRepo }
