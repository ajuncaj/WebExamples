// ===================== Winter 2021 EECS 493 Assignment 2 =====================
// This starter code provides a structure and helper functions for implementing
// the game functionality. It is a suggestion meant to help you, and you are not
// required to use all parts of it. You can (and should) add additional functions
// as needed or change existing functions.

// ==============================================
// ============ Page Scoped Globals Here ========
// ==============================================

// Counters
let throwingItemIdx = 1;
let beadsCounter = 0;
let candyCounter = 0;
let score = 0;

// Array for Items
let arr = [];

// Size Constants
const FLOAT_1_WIDTH = 149;
const FLOAT_2_WIDTH = 101;
const FLOAT_SPEED = 2;
const PERSON_SPEED = 25;
const OBJECT_REFRESH_RATE = 50;  //ms
const SCORE_UNIT = 100;  // scoring is in 100-point units

// Size vars
let maxPersonPosX, maxPersonPosY;
let maxItemPosX;
let maxItemPosY;

// Global Window Handles (gwh__)
let gwhGame, gwhStatus, gwhScore;

// Global Object Handles
let player;
let paradeRoute;
let paradeFloat1;
let paradeFloat2;
let paradeTimer;

/*
 * This is a handy little container trick: use objects as constants to collect
 * vals for easier (and more understandable) reference to later.
 */
const KEYS = {
  left: 37,
  up: 38,
  right: 39,
  down: 40,
  shift: 16,
  spacebar: 32
};

let createThrowingItemIntervalHandle;
let currentThrowingFrequency = 2000;


// ==============================================
// ============ Functional Code Here ============
// ==============================================

// Main
$(document).ready( function() {
  console.log("Ready!");
	
  // TODO: Event handlers for the settings panel
	
	$('#openSettings').click(function(){
		$('.settingsPanel').css('visibility', 'visible');
		$('#openSettings').css('visibility', 'hidden');
		$('#inbox').val(currentThrowingFrequency);
	});
	
	$('#saveSettings').click(function(){
		var newThrowingFrequency = $('#inbox').val();
		if (newThrowingFrequency >= 100 && Number.isInteger(parseInt(newThrowingFrequency))) {
			currentThrowingFrequency = newThrowingFrequency;
			clearInterval(createThrowingItemIntervalHandle);
			createThrowingItemIntervalHandle = setInterval(createThrowingItem, currentThrowingFrequency);
			$('.settingsPanel').css('visibility', 'hidden');
			$('#openSettings').css('visibility', 'visible');
		}
		else {
			alert("Frequency must be a number greater than or equal to 100");
		}
	});
	
	$('#discardSettings').click(function(){
		$('.settingsPanel').css('visibility', 'hidden');
		$('#openSettings').css('visibility', 'visible');
	});
	
  // TODO: Add a splash screen and delay starting the game

  // Set global handles (now that the page is loaded)
  // Allows us to quickly access parts of the DOM tree later
  gwhGame = $('#actualGame');
  gwhStatus = $('.status-window');
  gwhScore = $('#score-box');
  player = $('#player');  // set the global player handle
  paradeRoute = $("#paradeRoute");
  paradeFloat1 = $("#paradeFloat1");
  paradeFloat2 = $("#paradeFloat2");

  // Set global positions for thrown items
  maxItemPosX = $('.game-window').width() - 50;
  maxItemPosY = $('.game-window').height() - 40;

  // Set global positions for the player
  maxPersonPosX = $('.game-window').width() - player.width();
  maxPersonPosY = $('.game-window').height() - player.height();

  // Keypress event handler
  $(window).keydown(keydownRouter);
  
  
  // Periodically check for collisions with thrown items (instead of checking every position-update)
  setInterval( function() {
    checkCollisions();
  }, 100);
  // Move the parade floats
	setTimeout(startParade, 3000)
	setTimeout(function() {
		$('#splashScreen').hide();
	}, 3000)
  // Throw items onto the route at the specified frequency
  createThrowingItemIntervalHandle = setInterval(createThrowingItem, currentThrowingFrequency);
  
});

// Key down event handler
// Check which key is pressed and call the associated function
function keydownRouter(e) {
  switch (e.which) {
    case KEYS.shift:
      break;
    case KEYS.spacebar:
      break;
    case KEYS.left:
    case KEYS.right:
    case KEYS.up:
    case KEYS.down:
      movePerson(e.which);
      break;
    default:
      console.log("Invalid input!");
  }
}

// Handle player movement events
// TODO: Stop the player from moving into the parade float. Only update if
// there won't be a collision
function movePerson(arrow) {
  
  switch (arrow) {
    case KEYS.left: { // left arrow
      let newPos = parseInt(player.css('left'))-PERSON_SPEED;
      if (newPos < 0) {
        newPos = 0;
      }
	  if (willCollide(player, paradeFloat2, -PERSON_SPEED, 0)) {
		newPos = parseInt(player.css('left'));
	  }
      player.css('left', newPos);
      break;
    }
    case KEYS.right: { // right arrow
      let newPos = parseInt(player.css('left'))+PERSON_SPEED;
      if (newPos > maxPersonPosX) {
        newPos = maxPersonPosX;
      }
	  if (willCollide(player, paradeFloat1, PERSON_SPEED + 2, 0)) {
		newPos = parseInt(player.css('left'));
	  }
      player.css('left', newPos);
      break;
    }
    case KEYS.up: { // up arrow
      let newPos = parseInt(player.css('top'))-PERSON_SPEED;
      if (newPos < 0) {
        newPos = 0;
      }
	  if (willCollide(player, paradeFloat2, 0, -PERSON_SPEED)) {
		newPos = parseInt(player.css('top'));
	  }
	  if (willCollide(player, paradeFloat1, 0, -PERSON_SPEED)) {
		newPos = parseInt(player.css('top'));
	  }
	  
      player.css('top', newPos);
      break;
    }
    case KEYS.down: { // down arrow
      let newPos = parseInt(player.css('top'))+PERSON_SPEED;
      if (newPos > maxPersonPosY) {
        newPos = maxPersonPosY;
      }
	  if (willCollide(player, paradeFloat2, 0, PERSON_SPEED)) {
		newPos = parseInt(player.css('top'));
	  }
	  if (willCollide(player, paradeFloat1, 0, PERSON_SPEED)) {
		newPos = parseInt(player.css('top'));
	  }
	  
      player.css('top', newPos);
      break;
    }
  }
}

// Check for any collisions with thrown items
// If needed, score and remove the appropriate item
function checkCollisions() {
	arr.forEach(function(p) {
		if (isColliding(player, p)) {
			delete p;
			p.remove();
			var value = parseInt($('#score-box').text(), 10) + SCORE_UNIT;
			$('#score-box').text(value);
			
			if (p.attr("class") === "throwingItem candy") {
				var value = parseInt($('#candyCounter').text(), 10) + 1;
				$('#candyCounter').text(value);
			}
			if (p.attr("class") === "throwingItem beads") {
				var value = parseInt($('#beadsCounter').text(), 10) + 1;
				$('#beadsCounter').text(value);
			}
		}
	});
}

// Move the parade floats (Unless they are about to collide with the player)
function startParade(){
  console.log("Starting parade...");
  paradeTimer = setInterval( function() {

      // TODO: (Depending on current position) update left value for each 
      // parade float, check for collision with player, etc.
	var newpos1 = parseInt(paradeFloat1.css('left')) +  FLOAT_SPEED;
	var newpos2 = parseInt(paradeFloat2.css('left')) +  FLOAT_SPEED;
	if (newpos1 > 500) {
		// If off the right, put back at start pos. 
		newpos1 = -300;
		newpos2 = -150;
	}
	if (isOrWillCollide(paradeFloat2, player, FLOAT_SPEED, 0)) {
		newpos1 = parseInt(paradeFloat1.css('left'));
		newpos2 = parseInt(paradeFloat2.css('left'));
	}
	paradeFloat1.css('left', newpos1);
	paradeFloat2.css('left', newpos2);
	
  }, OBJECT_REFRESH_RATE);
}

// Get random position to throw object to, create the item, begin throwing
function createThrowingItem(){
	var type;
	var imageString;
	
	var thrownType = getRandomNumber(1, 100);
	if (thrownType >= 1 && thrownType <= 33) {
		type = "candy"
		imageString = "candy.png";
	}
	else {
		type = "beads"
		imageString = "beads.png"
	}
	
	// make new item and put in game window
	var candy = createItemDivString(throwingItemIdx, type, imageString);
	gwhGame.append(candy);
	
	
	// Get a JQ reference and push into arr
	var currentCandy = $('#i-' + throwingItemIdx);
	arr.push(currentCandy);
	
	// Set size
	var img = document.getElementById('i-' + throwingItemIdx).getElementsByTagName('img');
	img[0].style.height = '40px';
	img[0].style.width = '40px';
	
	throwingItemIdx++;
	
	var paradeCords = paradeFloat2.offset();
	currentCandy.offset(paradeCords);
	// ???
	var randX = getRandomNumber(-20, 20);
	var randY = getRandomNumber(-20, 20);
	updateThrownItemPosition(currentCandy, randX, randY, 10);
}

// Helper function for creating items
// throwingItemIdx - index of the item (a unique identifier)
// type - beads or candy
// imageString - beads.png or candy.png
function createItemDivString(itemIndex, type, imageString){
  return "<div id='i-" + itemIndex + "' class='throwingItem " + type + "'><img src='img/" + imageString + "'/></div>";
}

// Throw the item. Meant to be run recursively using setTimeout, decreasing the 
// number of iterationsLeft each time. You can also use your own implementation.
// If the item is at it's final postion, start removing it.
function updateThrownItemPosition(elementObj, xChange, yChange, iterationsLeft){
	if (iterationsLeft > 0) {
		// Move it!
		elementObj.css('top', parseInt(elementObj.css('top')) + yChange);
		elementObj.css('left', parseInt(elementObj.css('left')) + xChange);
		setTimeout(function() {
		updateThrownItemPosition(elementObj, xChange, yChange, iterationsLeft - 1);
		}, 10);
	}
	else {
		// Lose it!
		setTimeout(graduallyFadeAndRemoveElement, 5000, elementObj);
		return;
	}
}

function graduallyFadeAndRemoveElement(elementObj){
  // Fade to 0 opacity over 2 seconds
  elementObj.fadeTo(2000, 0, function(){
	$(this).remove();
	arr.forEach(function(p) {
		if (elementObj === p) {
			delete p;
		}
	});
  });
}

// ==============================================
// =========== Utility Functions Here ===========
// ==============================================

// Are two elements currently colliding?
function isColliding(o1, o2) {
  return isOrWillCollide(o1, o2, 0, 0);
}

// Will two elements collide soon?
// Input: Two elements, upcoming change in position for the moving element
function willCollide(o1, o2, o1_xChange, o1_yChange){
  return isOrWillCollide(o1, o2, o1_xChange, o1_yChange);
}

// Are two elements colliding or will they collide soon?
// Input: Two elements, upcoming change in position for the moving element
// Use example: isOrWillCollide(paradeFloat2, person, FLOAT_SPEED, 0)
function isOrWillCollide(o1, o2, o1_xChange, o1_yChange){
  const o1D = { 'left': o1.offset().left + o1_xChange,
        'right': o1.offset().left + o1.width() + o1_xChange,
        'top': o1.offset().top + o1_yChange,
        'bottom': o1.offset().top + o1.height() + o1_yChange
  };
  const o2D = { 'left': o2.offset().left,
        'right': o2.offset().left + o2.width(),
        'top': o2.offset().top,
        'bottom': o2.offset().top + o2.height()
  };
  // Adapted from https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
  if (o1D.left < o2D.right &&
    o1D.right > o2D.left &&
    o1D.top < o2D.bottom &&
    o1D.bottom > o2D.top) {
     // collision detected!
     return true;
  }
  return false;
}

// Get random number between min and max integer
function getRandomNumber(min, max){
  return (Math.random() * (max - min)) + min;
}