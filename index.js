const core = require( '@actions/core' );
const github = require( '@actions/github' );
const fs = require( 'fs' );
const { readdirSync } = require( 'fs' )

function getDirectories( path ) {
  return fs.readdirSync( path ).filter( function( file ) {
    return fs.statSync( path + '/' + file ).isDirectory();
  } );
}

try {
  const packageDir = core.getInput( 'package-dir' );
  const tagJson = JSON.parse( core.getInput( 'tag-json' ) );
  const imageName = core.getInput( 'image-name' );
  const dockerhubUsername = core.getInput( 'dockerhub-username' );

  console.log( packageDir );
  console.log( tagJson.tags );
  const tagArray = tagJson.tags.map( tags => tags.replace( `${imageName}:`, '' ) );
  tagArray.push( 'latest' )
  const projectNames = getDirectories( packageDir );
  const dockerCommands = [];
  projectNames.forEach( projectName => {
    const imageTags = tagArray.map( tag => `${dockerhubUsername}/${projectName}:${tag}` )
    const dockerBuildString = `docker build -f ${packageDir}/${projectName}/Dockerfile . -t ${imageTags.join( '  -t ' )}`
    const dockerPushString = `docker push -a ${dockerhubUsername}/${projectName}`
    dockerCommands.push( dockerBuildString );
    dockerCommands.push( dockerPushString );
  } );
  console.log( dockerCommands );
  const time = (new Date()).toTimeString();
  core.setOutput( "time", time );
  // Get the JSON webhook payload for the event that triggered the workflow
  // const payload = JSON.stringify(github.context.payload, undefined, 2)
  // console.log(`The event payload: ${payload}`);
} catch ( error ) {
  core.setFailed( error.message );
}
