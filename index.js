const core = require( '@actions/core' );
const github = require( '@actions/github' );
const exec = require( '@actions/exec' );
const fs = require( 'fs' );

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
  // remove dummy image name from tag array
  const tagArray = tagJson.tags.map( tags => tags.replace( `${imageName}:`, '' ) );
  tagArray.push( 'latest' )
  // all directories are also project names fro NX
  const projectNames = getDirectories( packageDir );
  const dockerCommands = [];
  // building the docker commands
  projectNames.forEach( projectName => {
    const imageTags = tagArray.map( tag => `${dockerhubUsername}/${projectName}:${tag}` )
    const dockerBuildString = `docker build -f ${packageDir}/${projectName}/Dockerfile . -t ${imageTags.join( '  -t ' )}`
    const dockerPushString = `docker push -a ${dockerhubUsername}/${projectName}`
    dockerCommands.push( dockerBuildString );
    dockerCommands.push( dockerPushString );
  } );
  console.log( dockerCommands );
  (async () => {

    for ( let dockerCommand of dockerCommands ) {
      await exec
        .getExecOutput( 'dockerCommand', [], {
          ignoreReturnCode: true
        } )
        .then( res => {
          if ( res.stderr.length > 0 && res.exitCode != 0 ) {
            throw new Error( `docker build failed with: ${res.stderr}` );
          }
        } );

    }
    console.log( 'this will print last' );
  })();
  const time = (new Date()).toTimeString();
  core.setOutput( "time", time );
  // Get the JSON webhook payload for the event that triggered the workflow
  // const payload = JSON.stringify(github.context.payload, undefined, 2)
  // console.log(`The event payload: ${payload}`);
} catch ( error ) {
  core.setFailed( error.message );
}
