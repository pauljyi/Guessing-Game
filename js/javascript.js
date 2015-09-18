
(function() {

  var $output;
  var _inited = false;
  var _locked = false;
  var _buffer = [];
  var _obuffer = [];
  var _ibuffer = [];
  var _cwd = ">";
  var _prompt = function() { return _cwd + "> "; };
  var _history = [];
  var _hindex = -1;
  var _lhindex = -1;
  var _number;
  var _comNumber;
  var _numGuess = 7;

  var _filetree = {
    'documents': {type: 'dir', files: {
      'example1': {type: 'file', mime: 'text/plain', content: "This is just an example file"},
      'example2': {type: 'file', mime: 'text/plain', content: "This is just an example file. What did you think it was?"},
      'example3': {type: 'file', mime: 'text/plain', content: "This is just an example file. I'm super cereal!"},
      'example4': {type: 'file', mime: 'text/plain', content: "This is just an example file. Such wow!"},
      'example5': {type: 'file', mime: 'text/plain', content: "This is just an example file. Jelly much?"}
    }},
    'storage':   {type: 'dir', files: {
    }},
    'AUTHORS': {type: 'file', mime: 'text/plain', content: "Created by Anders Evenrud <andersevenrud@gmail.com>\n\nThis is a demo using CSS only for graphics (no images), and JavaScript for a basic command line"},
    'README' : {type: 'file', mime: 'text/plain', content: 'All you see here is CSS. No images were used or harmed in creation of this demo'},
    'LICENSE': {type: 'file', mime: 'text/plain', content: "Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the \"Software\"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE."}
  };

  var _commands = {
    yes: function() {
      comNumber=Math.floor((Math.random()*100)+1);
      alert(comNumber);
      return ([
        "I'll pick a number between 1 and 100.\nYou try to guess what it is.\nex. 'guess 13' \n\nYou have 7 tries, don't mess it up..."

      ]);

    },

    // guess: function(number) {
    //
    //   if(number < 1 || number > 100){
    //     return (["try number beetwenn 1 and 100 \n"]);
    //   } else {
    //       if (number = comNumber)
    //         return (["you win \n"]);
    //     }else {
    //       if (number < comNumber)
    //         return (["Too Low, \n Try again."]);
    //     } else {
    //         if (number > comNumber)
    //           return (["Too High, \n Try again."]);
    //     }
    //
    //
    // },
    //

    guess: function(number) {
      _numGuess--;
      alert(_numGuess);
      if (number === parseInt(number, 10) && number>0 || number<101)
      {
        if(number < comNumber) {
          if (_numGuess < 7) {
            return(["Too Low. \nYou have " + _numGuess + " guesses left."])
          } else {
            return(["You are out of tries."]);
          }
        } else if (number > comNumber) {
          if (_numGuess < 7) {
            return(["Too High. \nYou have " + _numGuess + " guesses left."])
          } else {
            return(["You are out of tries."]);
          }
        }else{
          return(["You Win!"])
        }
      } else {
        return (["I'm sorry User, I can't do that. \nEnter a number between 1 and 100. \nYou have " + _numGuess + " guesses left. "])
      }},

      help: function() {
        var out = [
          'help                                         This command',
          'contact                                      How to contact author',
          'contact <key>                                  Open page (example: `email` or `google+`)',
          'clear                                        Clears the screen',
          'ls                                           List current (or given) directory contents',
          'cd <dir>                                     Enter directory',
          'cat <filename>                               Show file contents',
          'sound [<volume 0-100>, <duration>, <freq>]   Generate a sound (WebKit only)',
          ''
        ];

        return out.join("\n");
      }

    };

    /////////////////////////////////////////////////////////////////
    // UTILS
    /////////////////////////////////////////////////////////////////

    function setSelectionRange(input, selectionStart, selectionEnd) {
      if (input.setSelectionRange) {
        input.focus();
        input.setSelectionRange(selectionStart, selectionEnd);
      }
      else if (input.createTextRange) {
        var range = input.createTextRange();
        range.collapse(true);
        range.moveEnd('character', selectionEnd);
        range.moveStart('character', selectionStart);
        range.select();
      }
    }

    function format(format) {
      var args = Array.prototype.slice.call(arguments, 1);
      var sprintfRegex = /\{(\d+)\}/g;

      var sprintf = function (match, number) {
        return number in args ? args[number] : match;
      };

      return format.replace(sprintfRegex, sprintf);
    }


    function padRight(str, l, c) {
      return str+Array(l-str.length+1).join(c||" ")
    }

    function padCenter(str, width, padding) {
      var _repeat = function(s, num) {
        for( var i = 0, buf = ""; i < num; i++ ) buf += s;
        return buf;
      };

      padding = (padding || ' ').substr( 0, 1 );
      if ( str.length < width ) {
        var len     = width - str.length;
        var remain  = ( len % 2 == 0 ) ? "" : padding;
        var pads    = _repeat(padding, parseInt(len / 2));
        return pads + str + pads + remain;
      }

      return str;
    }

    function parsepath(p) {
      var dir = (p.match(/^\//) ? p : (_cwd  + '/' + p)).replace(/\/+/g, '/');
      return realpath(dir) || '/';
    }

    function getiter(path) {
      var parts = (path.replace(/^\//, '') || '/').split("/");
      var iter = null;

      var last = _filetree;
      while ( parts.length ) {
        var i = parts.shift();
        if ( !last[i] ) break;

        if ( !parts.length ) {
          iter = last[i];
        } else {
          last = last[i].type == 'dir' ? last[i].files : {};
        }
      }

      return iter;
    }

    function realpath(path) {
      var parts = path.split(/\//);
      var path = [];
      for ( var i in parts ) {
        if ( parts.hasOwnProperty(i) ) {
          if ( parts[i] == '.' ) {
            continue;
          }

          if ( parts[i] == '..' ) {
            if ( path.length ) {
              path.pop();
            }
          } else {
            path.push(parts[i]);
          }
        }
      }

      return path.join('/');
    }

    window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame    ||
      function( callback ){
        window.setTimeout(callback, 1000 / 60);
      };
    })();

    /////////////////////////////////////////////////////////////////
    // SHELL
    /////////////////////////////////////////////////////////////////

    (function animloop(){
      requestAnimFrame(animloop);

      if ( _obuffer.length ) {
        $output.value += _obuffer.shift();
        _locked = true;

        update();
      } else {
        if ( _ibuffer.length ) {
          $output.value += _ibuffer.shift();

          update();
        }

        _locked = false;
        _inited = true;
      }
    })();

    function print(input, lp) {
      update();
      _obuffer = _obuffer.concat(lp ? [input] : input.split(''));
    }

    function update() {
      $output.focus();
      var l = $output.value.length;
      setSelectionRange($output, l, l);
      $output.scrollTop = $output.scrollHeight;
    }

    function clear() {
      $output.value = '';
      _ibuffer = [];
      _obuffer = [];
      print("");
    }

    function command(cmd) {
      print("\n");
      if ( cmd.length ) {
        var a = cmd.split(' ');
        var c = a.shift();
        if ( c in _commands ) {
          var result = _commands[c].apply(_commands, a);
          if ( result === false ) {
            clear();
          } else {
            print(result || "\n", true);
          }
        } else {
          print("Unknown command: " + c);
        }

        _history.push(cmd);
      }
      print("\n\n" + _prompt());

      _hindex = -1;
    }

    function nextHistory() {
      if ( !_history.length ) return;

      var insert;
      if ( _hindex == -1 ) {
        _hindex  = _history.length - 1;
        _lhindex = -1;
        insert   = _history[_hindex];
      } else {
        if ( _hindex > 1 ) {
          _lhindex = _hindex;
          _hindex--;
          insert = _history[_hindex];
        }
      }

      if ( insert ) {
        if ( _lhindex != -1 ) {
          var txt = _history[_lhindex];
          $output.value = $output.value.substr(0, $output.value.length - txt.length);
          update();
        }
        _buffer = insert.split('');
        _ibuffer = insert.split('');
      }
    }

    window.onload = function() {
      $output = document.getElementById("output");
      $output.contentEditable = true;
      $output.spellcheck = false;
      $output.value = '';

      $output.onkeydown = function(ev) {
        var k = ev.which || ev.keyCode;
        var cancel = false;

        if ( !_inited ) {
          cancel = true;
        } else {
          if ( k == 9 ) {
            cancel = true;
          } else if ( k == 38 ) {
            nextHistory();
            cancel = true;
          } else if ( k == 40 ) {
            cancel = true;
          } else if ( k == 37 || k == 39 ) {
            cancel = true;
          }
        }

        if ( cancel ) {
          ev.preventDefault();
          ev.stopPropagation();
          return false;
        }

        if ( k == 8 ) {
          if ( _buffer.length ) {
            _buffer.pop();
          } else {
            ev.preventDefault();
            return false;
          }
        }

        return true;
      };

      $output.onkeypress = function(ev) {
        ev.preventDefault();
        if ( !_inited ) {
          return false;
        }

        var k = ev.which || ev.keyCode;
        if ( k == 13 ) {
          var cmd = _buffer.join('').replace(/\s+/, ' ');
          _buffer = [];
          command(cmd);
        } else {
          if ( !_locked ) {
            var kc = String.fromCharCode(k);
            _buffer.push(kc);
            _ibuffer.push(kc);
          }
        }

        return true;
      };

      $output.onfocus = function() {
        update();
      };

      $output.onblur = function() {
        update();
      };

      window.onfocus = function() {
        update();
      };

      print("Initializing HAL v0.1 ................................................................\n");
      print("\n\n");

      //print("------------------------------------------------------------------------------------------------------------------");
      print("                        #####     #####                    #####     #####                   \n", true);
      print("                        #####     #####                    #####     #####                   \n", true);
      print("                  ##########################         ##########################              \n", true);
      print("                  ##########################         ##########################              \n", true);
      print("                        #####     #####                    #####     #####                   \n", true);
      print("                        #####     #####                    #####     #####                   \n", true);
      print("                  ##########################         ##########################              \n", true);
      print("                  ##########################         ##########################              \n", true);
      print("                        #####     #####                    #####     #####                   \n", true);
      print("                        #####     #####                    #####     #####                   \n", true);
      print("\n\n", true);

      print("Hello User, would you like to play a game? \n", true);
      print("\n" + _prompt());

    };

  })();
