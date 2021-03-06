var quickconnect = require('../');
var crel = require('crel');
var rtc = require('rtc');

// create containers for our local and remote video
var local = crel('div', { class: 'local' });
var remote = crel('div', { class: 'remote' });

var peers = {};
var peerVideos = {};

// capture local media
var media = rtc.media();

function handleConnect(conn, id, data, monitor) {
  // save the peer
  peers[id] = conn;

  // hook up our local media
  if (media.stream) {
    conn.addStream(media.stream);
  }
  else {
    media.once('capture', conn.addStream.bind(conn));
  }

  // add existing remote streams
  conn.getRemoteStreams().forEach(renderRemote(id));

  // listen for new streams
  conn.addEventListener('addstream', function(evt) {
    renderRemote(id)(evt.stream);
  });
}

// handle the signaller telling us a peer is leaving
function handleLeave(id) {
  // remove old streams
  (peerVideos[id] || []).forEach(function(el) {
    el.parentNode.removeChild(el);
  });

  peerVideos[id] = undefined;

  // close the peer connection
  peers[id].close();
  peers[id] = undefined;
}

// render a remote video
function renderRemote(id) {
  // create the peer videos list
  peerVideos[id] = peerVideos[id] || [];

  return function(stream) {
    peerVideos[id] = peerVideos[id].concat(rtc.media(stream).render(remote));
  }
}
// render to local
media.render(local);

// handle the connection stuff
quickconnect('test')
  .on('peer', handleConnect)
  .on('leave', handleLeave);

/* extra code to handle dynamic html and css creation */

// add some basic styling
document.head.appendChild(crel('style', [
  '.local { position: absolute;  right: 10px; }',
  '.local video { max-width: 200px; }'
].join('\n')));

// add the local and remote elements
document.body.appendChild(local);
document.body.appendChild(remote);