/**
 ********************************* EXPORTS *********************************
 */

module.exports.webmp4 = webmp4;
module.exports.webm = webm;
module.exports.divx = divx;
module.exports.flashvideo = flashvideo;
module.exports.podcast = podcast;

/**
 ********************************* METHODS *********************************
 */

function webmp4(command) {
  command.format('mp4')
    .videoBitrate('1024k')
    .videoCodec('libx264')
    .size('720x?')
    .audioBitrate('128k')
    .audioChannels(2)
    .audioCodec('libfdk_aac');
}

function webm(command) {
  command.format('webm')
    .videoBitrate('1024k')
    .videoCodec('libvpx')
    .size('720x?')
    .audioBitrate('128k')
    .audioChannels(2)
    .audioCodec('libvorbis');
}

function divx(command) {
  command.format('avi')
    .videoBitrate('1024k')
    .videoCodec('mpeg4')
    .size('720x?')
    .audioBitrate('128k')
    .audioChannels(2)
    .audioCodec('libmp3lame')
    .outputOptions(['-vtag DIVX']);
}

function flashvideo(command) {
  command.format('flv')
    .flvmeta()
    .size('320x?')
    .videoBitrate('512k')
    .videoCodec('libx264')
    .fps(24)
    .audioBitrate('96k')
    .audioCodec('aac')
    .audioFrequency(22050)
    .audioChannels(2);
}

function podcast(command) {
  command.format('m4v')
    .videoBitrate('512k')
    .videoCodec('libx264')
    .size('320x176')
    .audioBitrate('128k')
    .audioCodec('aac')
    .audioChannels(1)
    .outputOptions([
      '-flags', '+loop', '-cmp', '+chroma', '-partitions',
      '+parti4x4+partp8x8+partb8x8', '-flags2',  '+mixed_refs',
      '-me_method umh', '-subq 5', '-bufsize 2M',
      '-rc_eq \'blurCplx^(1-qComp)\'', '-qcomp 0.6', '-qmin 10',
      '-qmax 51', '-qdiff 4', '-level 13'
    ]);
}
