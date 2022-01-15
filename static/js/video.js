function delay_load() {
   load_video_subtitle();
   videoElement.blur();
   $(document).keydown(function (event) {
      var key = event.code;
      if (key == 'ArrowUp' || key == 'ArrowDown')
         event.preventDefault();
   });
   window.addEventListener("keydown", function (evt) {
      videoElement.blur();
      $(".word_block").hide();
      var key = evt.code;
      switch (key) {
         case 'Space':
            if (videoElement.paused) {
               videoElement.play();
            }
            else {
               videoElement.pause();
            }
            break;
         case 'KeyR':
            control_cue('re');
            break;
         case 'ArrowLeft':
            control_cue('pre');
            break;
         case 'ArrowRight':
            control_cue('next');
            break;
         case 'ArrowUp':
            var volume = parseInt(videoElement.volume * 100);
            volume += 10;
            if (volume > 100) volume = 100;
            $('#volumeHint_text').text(volume + '%');
            videoElement.volume = volume / 100;
            $('.video_volumeHint').css('display', 'flex');
            setTimeout(function () {
               $('.video_volumeHint').css('display', 'none');
            }, 1000);
            break;
         case 'ArrowDown':
            var volume = parseInt(videoElement.volume * 100);
            volume -= 10;
            if (volume < 0) volume = 0;
            $('#volumeHint_text').text(volume + '%');
            videoElement.volume = volume / 100;
            $('.video_volumeHint').css('display', 'flex');
            setTimeout(function () {
               $('.video_volumeHint').css('display', 'none');
            }, 1000);
            break;
      }
   });

   video_speed();
   $('#speed_btn').click(function () {
      if ($('#speed').css('display') == 'inline-block') {
         $('#speed').css('display', 'none');
      } else {
         $('#speed').css('display', 'inline-block');
      }
   });

   $('#favorite').click(function () {
      // $('#favorite').addClass('btn_on')
      if ("{{data['favorite']}}" == '1') return;
      $.ajax({
         url: '/add_to_my_video',
         type: 'POST',
         data: { 'V_id': "{{data['V_id']}}" },
         success: function () {
            $('#favorite img').attr('src', 'https://www.flaticon.com/svg/static/icons/svg/3529/3529890.svg');
         },
         error: function () {
            alert('error');
         }

      })
   });


   $('#setting_icon').click(function () {
      if ($('#setting_block').css('display') == 'none') {
         $('#setting_block').css('display', 'block');
         $('#setting_icon').css('background-image', 'url(https://www.flaticon.com/svg/static/icons/svg/653/653268.svg)');

      } else {
         $('#setting_block').css('display', 'none');
         $('#setting_icon').css('background-image', 'url(https://www.flaticon.com/svg/static/icons/svg/3524/3524623.svg)');
      }
   });
}
function load_video_subtitle() {
   videoElement = document.querySelector("video");
   var textTrackList = videoElement.textTracks; // one for each track element
   KRtrack = textTrackList[0];
   TWtrack = textTrackList[1];

   if (KRtrack.cues.length != 0) {
      id = 0;
      startTime = KRtrack.cues[id].startTime;
      KRtrack.addEventListener('cuechange', function () {
         var cues = KRtrack.activeCues;
         if (cues.length == 1) {
            $('#KR').text(cues[0].text);
            id = KRtrack.activeCues[0].id - 1;
            // console.log(id)
         } else {
            $('#KR').text("");//當沒字幕時變空白
         }
      });

   } else {
      $('#KRbtn').removeClass("btn_on");
      $('#KRbtn').addClass("btn_off");
      document.getElementById("KRbtn").disabled = true;
   }
   if (TWtrack.cues.length != 0) {
      TWtrack.addEventListener('cuechange', function () {
         var cues = TWtrack.activeCues;  // array of current cues
         if (cues.length == 1) {
            $('#TW').text(cues[0].text)
         } else {
            $('#TW').text("");//當沒字幕時變空白
         }
      });
   } else {
      $('#TWbtn').removeClass("btn_on");
      $('#TWbtn').addClass("btn_off");
      document.getElementById("TWbtn").disabled = true;
   }

}

function subtitle_setting(lang, myObj) {
   // console.log(myObj);
   $('#' + lang).text('')
   var videoElement = document.querySelector("video");
   var textTrackList = videoElement.textTracks; // one for each track element
   if (lang == 'KR') {
      textTrack = textTrackList[0]
   }
   if (lang == 'TW') {
      textTrack = textTrackList[1]
   }

   if ($(myObj).hasClass("btn_on")) {
      $(myObj).removeClass("btn_on");
      $(myObj).addClass("btn_off");
      textTrack.mode = "disabled"
   } else {
      $(myObj).removeClass("btn_off");
      $(myObj).addClass("btn_on");
      textTrack.mode = "hidden"
   }
}

function getSelectTxt(e) {
   if (window.getSelection) {
      txt = "" + window.getSelection();
   } else if (document.selection && document.selection.createRange) {
      txt = document.selection.createRange().text;
   }
   txt = txt.trim();
   if (txt == "") {//当选中内容为空时，阻止事件发生
      window.event ? window.event.cancelBubble = true : e.stopPropagation();
   } else {
      // console.log(txt);
      $(".word_block").empty();
      $.ajax({
         // url:'https://tip.dict.naver.com/datajsonp/ko/zh/pc/arken?prCode=dict&entryName='+txt,
         url: '/naver_api',
         type: 'POST',
         dataType: "json",

         // dataType: "jsonp",//跨域傳送
         data: { 'query': txt },
         success: function (res) {
            var result = res['data']['result']
            if (result != null) {
               var items = result['items']
               // console.log(result)
               for (item in items) {
                  item = items[item];
                  // console.log(item);
                  $(".word_block").append(
                     '<div class="word"></div>'
                  );
                  $(".word").last().append(
                     `<a target="_blank" href="${item['destinationLink']}">
                               <div class="entryName">${item['entryName']}<span>${item['chinaWord']}</span></div>
                           </a>`
                  );
                  if (item['pronounceList'][0]['sign']) {
                     $(".word").last().append(
                        `<span class="pronounce">
                               [${item['pronounceList'][0]['sign']}]
                           </span>`
                     );
                  }
                  $(".word").last().append(`<button class="u_btn_pronun" onclick="play(this,'${item['pronounceList'][0]['pronunceUrl']}')">`);
                  $(".word").last().append('<ol></ol>')
                  meaningList = item['partOfSpeechList'][0]['meaningList']
                  for (i in meaningList) {
                     $('ol').last().append(`<li>${meaningList[i]['desciption']}</li>`)
                  }
               }
               $('.word_block').append(
                  `<div class="more_word">
                           <a target="_blank" href="${result['moreDetailUrl']}">
                               察看所有結果 >
                           </a>
                       </div>`
               )

            } else {
               console.log('null')
               $(".word_block").append('<div class="word">null</div>');
            }
            $(".word_block").show();
         },
         error: function (res) {
            console.log("error")
         }
      })
   }

}
//滑鼠點擊其他地方時隱藏
$(document).mousedown(function (e) {
   var container = $(".word_block"); // 這邊放你想要排除的區塊
   if (!container.is(e.target) && container.has(e.target).length === 0) {
      container.empty();
      container.hide();
   }
});
//播放發音
function play(myObj, sound) {
   $(myObj).addClass("active");
   var audio = document.getElementById("audio");
   audio.setAttribute('src', sound);
   audio.play();
   audio.addEventListener("ended", function () {
      $(myObj).removeClass("active");
   });
}


function video_speed() {
   var slider = document.getElementById('myRange');
   var output = document.getElementById("speed_value");
   var video = document.querySelector("video")
   output.innerHTML = slider.value / 10;
   slider.oninput = function () {
      output.innerHTML = slider.value / 10;
      video.playbackRate = slider.value / 10;
   }
}

function re_cue() {
   videoElement.currentTime = startTime + 0.0001;
}
function control_cue(query) {
   switch (query) {
      case 'pre':
         if (KRtrack.activeCues[0] != null) {
            --id;
            if (id < 0) id = 0;
         }
         // console.log(id);
         videoElement.currentTime = KRtrack.cues[id].startTime;
         startTime = KRtrack.cues[id].startTime;
         break;
      case 're':
         startTime = KRtrack.activeCues[0].startTime;
         if ($('#re_cue').hasClass("btn_off")) {
            if (KRtrack.activeCues[0] == null) return;
            $('#re_cue').removeClass("btn_off");
            $('#re_cue').addClass("btn_on");
            KRtrack.addEventListener('cuechange', re_cue);
            $('#text').css('border', '5px solid black');
         } else {
            $('#re_cue').removeClass("btn_on");
            $('#re_cue').addClass("btn_off");
            KRtrack.removeEventListener('cuechange', re_cue);
            $('#text').css('border', 'none');

         }
         break;
      case 'next':
         ++id;
         // console.log(id);
         videoElement.currentTime = KRtrack.cues[id].startTime;
         startTime = KRtrack.cues[id].startTime;
         break;
   }
}