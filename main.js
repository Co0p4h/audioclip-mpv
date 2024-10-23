var start_time = null;
var end_time = null;
var menu_open = false;

var config = {
  audio_folder_path: mp.get_property("working-directory"),
  audio_extension: ".mp3",
  audio_bitrate: "256k",
  include_timestamp: true,
};

var key_binds = {
  open_menu: 'm',
  close_menu: 'ESC',
  set_start_time: 's',
  set_end_time: 'e',
  create_audio_clip: 'C'
}

// function to construct ffmpeg arguments for audio clipping
function mkargs_audio(clip_filename, audio_track_id) {
  var clip_path = config.audio_folder_path + '/' + clip_filename + config.audio_extension;
  return [
    "ffmpeg", "-y", // force overwrite
    "-i", mp.get_property("path"),
    "-map", "0:a:" + (audio_track_id - 1), // map the selected audio track 
    "-ss", String(start_time), "-to", String(end_time),
    "-q:a", "0", // set the audio quality to highest for mp3
    "-vn", // disable video recording
    "-b:a", config.audio_bitrate,
    clip_path
  ];
}

function display_menu() {
  var menu_text = [
    "Audio Clip Menu",
    key_binds.set_start_time + ": Set Start Time (current: " + (start_time !== null ? start_time.toFixed(2) : "not set") + "s)",
    key_binds.set_end_time + ": Set End Time (current: " + (end_time !== null ? end_time.toFixed(2) : "not set") + "s)",
    key_binds.create_audio_clip + ": Create Audio Clip",
    key_binds.close_menu + ": Close Menu"
  ].join("\n");

  mp.osd_message(menu_text, 30);
}

function open_menu() {
  menu_open = true;
  display_menu();
}

function close_menu() {
  menu_open = false;
  mp.osd_message("");
}

function set_start_time() {
  if (menu_open) {
    start_time = mp.get_property_number("time-pos");
    mp.osd_message("Start time set: " + start_time.toFixed(2) + "s", 2);
    display_menu();
  }
}

function set_end_time() {
  if (menu_open) {
    end_time = mp.get_property_number("time-pos");
    // mp.osd_message("End time set: " + end_time.toFixed(2) + "s", 2);
    display_menu();
  }
}

function open_folder() {
  var command;
  switch (mp.get_property("platform")) {
    case "windows":
      command = ["explorer", config.audio_folder_path];
      break;
    case "darwin":
      command = ["open", config.audio_folder_path];
      break;
    default:
      command = ["xdg-open", config.audio_folder_path];
      break;
  }

  mp.command_native_async({
    name: "subprocess",
    args: command
  });
}

function format_time(seconds) {
  var minutes = Math.floor(seconds / 60);
  var secs = Math.floor(seconds % 60);

  return minutes + "-" + secs;
}

function generate_filename() {
  var base_filename = mp.get_property("filename/no-ext");
  var timestamp = config.include_timestamp
    ? '_' + format_time(start_time) + '_to_' + format_time(end_time)
    : '';
  return base_filename + timestamp;
}

function create_audio_clip() {
  if (!menu_open || start_time === null || end_time === null || start_time >= end_time) {
    mp.osd_message("invalid start/end times", 2);
    return;
  }

  var filename = generate_filename();
  var audio_track_id = mp.get_property_number("aid"); // get the current audio track ID
  var args = mkargs_audio(filename, audio_track_id);

  mp.command_native_async({ name: "subprocess", args: args }, function (success) {
    if (success) {
      var output_path = config.audio_folder_path + '/' + filename + "_clip" + config.audio_extension;
      mp.osd_message("audio clip created: " + output_path, 2);
      open_folder();
    } else {
      mp.osd_message("error creating audio clip", 2);
    }
  });
}

mp.add_key_binding(key_binds.open_menu, "open_menu", open_menu);
mp.add_key_binding(key_binds.close_menu, "close_menu", close_menu);
mp.add_key_binding(key_binds.set_start_time, "set_start_time", set_start_time);
mp.add_key_binding(key_binds.set_end_time, "set_end_time", set_end_time);
mp.add_key_binding(key_binds.create_audio_clip, "create_audio_clip", create_audio_clip);