require([
  'dojo/json',
  'esri/config',
  'esri/identity/IdentityManager',
  'esri/tasks/GeometryService'
], function(JSON, esriConfig, IdentityManager, GeometryService) {
  esriConfig.geometryService = new GeometryService("//tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");

  var id = localStorage.getItem('intern-id-config');
  if (id) {
    IdentityManager.initialize(JSON.parse(id));
  }

  IdentityManager.on('credential-create', function(cred) {
    localStorage.setItem('intern-id-config', JSON.stringify(IdentityManager.toJson()));
  });
});
