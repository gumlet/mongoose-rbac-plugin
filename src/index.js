module.exports = function role (schema, options) {
  // Set the default options
  options = Object.assign(
    {
      roles: [],
      accessLevels: {},
      maxLevel: Number,
      rolePath: 'roles',
      rolesStaticPath: 'roles',
      accessLevelsStaticPath: 'accessLevels',
      maxLevelPath: 'maxLevel',
      hasAccessMethod: 'hasAccess',
      roleHasAccessMethod: 'roleHasAccess',
      hasAccessOnRoute: 'hasAccessOnRoute'
    },
    options
  )

  // Set the role path when not provided
  if (!schema.path(options.rolePath)) {
    schema
      .path(options.rolePath, [])
      .path(options.rolePath)
      .required(true)
  }

  // Expose the roles
  schema.static(options.rolesStaticPath, options.roles)
  schema.static(options.accessLevelsStaticPath, options.accessLevels)
  schema.static(options.maxLevelPath, options.maxLevel)

  // Set the hasAccess method
  schema.method(options.hasAccessMethod, function (accessLevels) {
    const userRoles = this.get(options.rolePath)
    return roleHasAccess(userRoles, accessLevels)
  })

  // Set the roleHasAccess method
  schema.static(options.roleHasAccessMethod, roleHasAccess)

  function roleHasAccess (roles, accessLevels) {
    if (typeof accessLevels === 'undefined') {
      return false
    }
    accessLevels = [].concat(accessLevels)
    // Goes through all access levels, and if any one of the access levels
    // doesn't exist in the roles, return false
    return !accessLevels.some(level => {
      const accesses = options.accessLevels[level] || []
      const intersection = roles.filter(value => accesses.includes(value))
      if (intersection.length === 0) { return true }
      return false
    })
  }

  schema.method(options.hasAccessOnRoute, function (req, res, next) {
    const userRoles = this.get(options.rolePath)
    const maxLevel = options.maxLevel
    if (hasAccessOnRoute(userRoles, req._parsedOriginalUrl.pathname, maxLevel)) {
      next()
    } else {
      res.set('Cache-Control', 'private, max-age=0')
      res.status(403).send('Access Denied.')
    }
  })

  function hasAccessOnRoute (userRoles, route, maxLevel) {
    const levels = route.split('/')
    if (levels.length < 1) {
      return false
    }
    return roleHasAccess(userRoles, levels.slice(1, maxLevel + 1))
  }
}
