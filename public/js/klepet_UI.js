function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  var jeSlika = sporocilo.match(/(https?:\/\/[^\s]*\.(?:jpg|png|gif))/gi, '<img src="$1" width="200" style="padding-left: 20px;"/>');
  var jeYoutube = sporocilo.match(/https:\/\/www\.youtube\.com\/watch\?v=([^\s]+)/gi);
  
  if (jeSmesko||jeSlika||jeYoutube) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/&lt;img/g, '<img').replace(/png\' \/&gt;/g, 'png\' />').replace(/&lt;br/g, '<br').replace(/&lt;iframe/g, '<iframe').replace(/&lt;\/iframe/g, '</iframe');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  }  
  else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSlike(sporocilo);
  sporocilo = dodajYoutube(sporocilo);
  sporocilo = dodajSmeske(sporocilo);
  
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
    $('#seznam-uporabnikov div').click(function(event) {
      vzdevek = $(this).text();
      $('#poslji-sporocilo').val('/zasebno'  + ' "'+vzdevek+'"').focus();
    });
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSlike(vhodnoBesedilo) {
  var iskanjeSlik = /(https?:\/\/[^\s]*\.(?:jpg|png|gif))/gi;
  var ujemanje = vhodnoBesedilo.match(iskanjeSlik);
  
  if(ujemanje != null){
    	ujemanje.forEach(function(url) {
    		vhodnoBesedilo = vhodnoBesedilo + '<br>' + url.replace(/(https?:\/\/[^\s]*\.(?:jpg|png|gif))/gi, "<img src='$1' width='200px' style='margin-left: 20px;' />" );
     	});
   
   }
  
  return vhodnoBesedilo
}

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}


function dodajYoutube(vhodnoBesedilo) {
  var iskanjeYoutube = /https:\/\/www\.youtube\.com\/watch\?v=([^\s]+)/gi;
  var ujemanje = vhodnoBesedilo.match(iskanjeYoutube);
  
  if(ujemanje != null){
   	ujemanje.forEach(function(url) {
   		vhodnoBesedilo = vhodnoBesedilo + '<br>' + url.replace(/https:\/\/www\.youtube\.com\/watch\?v=([^\s]+)/gi, '<iframe src="https://www.youtube.com/embed/$1" style="margin-left: 20px width="200px" height="150px";" allowfullscreen></iframe>' );
   	});
  
  }
 
  return vhodnoBesedilo;
}
