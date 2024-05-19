var start_time = null;
var end_time = null;
var menu_open = false;

var config = {
  audio_folder_path: mp.get_property("working-directory"),
  audio_extension: ".mp3",
  audio_bitrate: "256k"
};

var key_binds = {
  open_menu: 'm',
  close_menu: 'ESC',
  set_start_time: 's',
  set_end_time: 'e',
  create_audio_clip: 'c'
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
  var osd_message = "Audio Clip Menu\n";
  osd_message += "s: Set Start Time (current: " + (start_time !== null ? start_time.toFixed(2) : "not set") + "s)\n";
  osd_message += "e: Set End Time (current: " + (end_time !== null ? end_time.toFixed(2) : "not set") + "s)\n";
  osd_message += "c: Create Audio Clip\n";
  osd_message += "ESC: Close Menu";
  mp.osd_message(osd_message, 30);
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
    mp.osd_message("End time set: " + end_time.toFixed(2) + "s", 2);
    display_menu();
  }
}

// make it easy to copy the just saved file 
function open_folder_in_finder() {
  var args = ["open", config.audio_folder_path];
  mp.command_native_async({
    name: "subprocess",
    args: args
  }, function (success, result) {
    if (success) {
      mp.osd_message("Opened folder in Finder", 2);
    } else {
      mp.osd_message("Error opening folder in Finder", 2);
    }
  });
}

function create_audio_clip() {
  if (menu_open && start_time !== null && end_time !== null && start_time < end_time) {
    var filename = mp.get_property("filename/no-ext");
    var audio_track_id = mp.get_property_number("aid"); // get the current audio track ID
    var args = mkargs_audio(filename + "_clip", audio_track_id);

    mp.command_native_async({ name: "subprocess", args: args }, function (success, result) {
      if (success) {
        var output_path = config.audio_folder_path + '/' + filename + "_clip" + config.audio_extension;
        mp.osd_message("audio clip created: " + output_path, 2);
        open_folder_in_finder();
      } else {
        mp.osd_message("error creating audio clip", 2);
      }
    });
  } else {
    mp.osd_message("invalid start/end times", 2);
  }
}

mp.add_key_binding(key_binds.open_menu, "open_menu", open_menu);
mp.add_key_binding(key_binds.close_menu, "close_menu", close_menu);
mp.add_key_binding(key_binds.set_start_time, "set_start_time", set_start_time);
mp.add_key_binding(key_binds.set_end_time, "set_end_time", set_end_time);
mp.add_key_binding(key_binds.create_audio_clip, "create_audio_clip", create_audio_clip);