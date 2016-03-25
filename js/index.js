var SETTINGS = {
	gameFiled: {
		x: 10,
		y: 20
	},
	scoreStep: 100,
	maxLevel: 10,
	levelSpeed: 1000,
	levelStep: 100,
	levelUp: 1000
}

var COLORS = ['green','orange','yellow','red','blue','white','purple'];

var CLASSES = {
	holder: '.wrapper',
	filed: '.field',
	state: 'state',
	sidebar: '.sidebar',
	restart: '.restart',
	stop: '.stop',
	start: '.start',
	level: '.level',
	score: '.score',
	next: '.figure',
	gameStart: 'game-start',
	gameStop: 'game-stop',
	pause: 'game-pause'
}

var VARGLOB = {
	level: 0,
	score: 0,
	colorFlag: false
}

jQuery(function() {
	init();
});

function init () {
	findElements();
	generateField();
	generateMarkup();
	generateFigures();
}

function findElements () {
	VARGLOB.body = jQuery('body');
	VARGLOB.holder = jQuery(CLASSES.holder);
	VARGLOB.field = VARGLOB.holder.find(CLASSES.filed);
	VARGLOB.sidebar = VARGLOB.holder.find(CLASSES.sidebar);
	VARGLOB.linkRestart = VARGLOB.sidebar.find(CLASSES.restart);
	VARGLOB.linkStop = VARGLOB.sidebar.find(CLASSES.stop);
	VARGLOB.linkStart = VARGLOB.sidebar.find(CLASSES.start);
	VARGLOB.levelHolder = VARGLOB.sidebar.find(CLASSES.level).find('em');
	VARGLOB.scoreHolder = VARGLOB.sidebar.find(CLASSES.score);
	VARGLOB.figureHolder = VARGLOB.sidebar.find(CLASSES.next);
}

function generateField () {
	VARGLOB.gameCell = [];
		
	for (var y = 0; y < SETTINGS.gameFiled.y; y++) {
		VARGLOB.gameCell[y] = [];
		for (var x = 0; x < SETTINGS.gameFiled.x; x++) {
			var tempObj = {
				state: 0
			};
			
			VARGLOB.gameCell[y][x] = tempObj;
		}
	}
}

function generateMarkup () {
	VARGLOB.field.css({
		"width": SETTINGS.gameFiled.x*30
	});
	
	for (var y = 0; y < SETTINGS.gameFiled.y; y++) {
		for (var x = 0; x < SETTINGS.gameFiled.x; x++) {
			var item = jQuery('<li></li>');
			item.attr('x',x);
			item.attr('y',y);
			VARGLOB.field.append(item);
		}
	}
	
	VARGLOB.elements = VARGLOB.field.find('li');
}

function generateFigures() {
	jQuery.getJSON('../inc/data.json', function(data) {
		handleData(data.figures);
	});
	
	function handleData (data) {
		VARGLOB.gameFigures = [];
		
		jQuery.each(data, function(key, val){
			VARGLOB.gameFigures.push({
				type: val.type,
				positions: val.positions
			});
		});
		
		setLevel();
		linkEvents();
	}
}

function gameControl (param) {
	if (VARGLOB.holder.hasClass(CLASSES.gameStop)) {
		VARGLOB.holder.removeClass(CLASSES.gameStop);
		VARGLOB.holder.addClass(CLASSES.gameStart);
	}
	
	var figures = VARGLOB.gameFigures;
	
	VARGLOB.colorFlag = true;
	
	if (VARGLOB.colorFlag) {
		VARGLOB.colorFlag = false;
		VARGLOB.currentColor = setColor();
	}
	
	if(!VARGLOB.nextFigure) {
		VARGLOB.activeFigure = selectFigures(figures);
		VARGLOB.nextFigure = selectFigures(figures);
	} else {
		VARGLOB.activeFigure = VARGLOB.nextFigure;
		VARGLOB.nextFigure = selectFigures(figures);
	}
	
	VARGLOB.nextFigure = selectFigures(figures);
	
	if(VARGLOB.figureHolder.hasClass(VARGLOB.figureHolder.attr('class'))) {
		VARGLOB.figureHolder.removeClass(VARGLOB.figureHolder.attr('class'));
	}
	
	VARGLOB.figureHolder.addClass(VARGLOB.nextFigure.type.toLowerCase());
	
	
	var initPos = VARGLOB.activeFigure.positions;
	var initFigure = VARGLOB.activeFigure.type;
	
	VARGLOB.currentPos = 0;
	VARGLOB.direction = 0;
	VARGLOB.down = 0;
	VARGLOB.moveFlag = true;
	
	if (!VARGLOB.events) {
		VARGLOB.events = true;
		gameEvents();
	}
	
	setState(initPos[VARGLOB.currentPos],initFigure);
	down();
}

function down(clear) {
	if(clear === 'pause') {
		if(!VARGLOB.pause) {
			clearInterval(VARGLOB.gameTimer);
			VARGLOB.holder.addClass(CLASSES.pause);
			VARGLOB.pause = true;
			return;
		} else {
			VARGLOB.pause = false;
			VARGLOB.holder.removeClass(CLASSES.pause);
		}
	}
	
	if(clear === 'end') {
		clearInterval(VARGLOB.gameTimer);
		if (VARGLOB.holder.hasClass(CLASSES.gameStart)) {
			VARGLOB.holder.removeClass(CLASSES.gameStart);
			VARGLOB.holder.addClass(CLASSES.gameStop);
		}
		VARGLOB.level = 0;
		VARGLOB.score = 0;
		VARGLOB.scoreHolder.text(VARGLOB.score);
		VARGLOB.levelHolder.text(VARGLOB.level);
		
		setState('end');
		return;
	}
	
	if(clear === 'clear') {
		clearInterval(VARGLOB.gameTimer);
		gameControl();
	} else {
		VARGLOB.gameTimer = setInterval(timerHandler, currentLevel());
	}
	
	function timerHandler () {
		VARGLOB.down++;
		setState(sendResponce('setState.pos'),sendResponce('setState.figure'));
	}
	
}

function sendResponce (param) {
	switch(param) {
		case 'figurePosition':
			return VARGLOB.activeFigure.positions;
			break;
		case 'setState.pos':
			return VARGLOB.activeFigure.positions[VARGLOB.currentPos];
			break;
		case 'setState.fugure':
			return VARGLOB.activeFigure.type;
			break;
	}
}
	
function setState (pos,initFigure) {
	if (pos === 'end') {
		for (var y = 0; y < SETTINGS.gameFiled.y; y++) {
			for (var x = 0; x < SETTINGS.gameFiled.x; x++) {
				VARGLOB.gameCell[y][x].state = 0;
			}
		}
		draw('end');
	} else {
		
		var points = pos.points;
	
		for (var y = 0; y < SETTINGS.gameFiled.y; y++) {
			for (var x = 0; x < SETTINGS.gameFiled.x; x++) {
				if (VARGLOB.gameCell[y][x].state != 2) {
					VARGLOB.gameCell[y][x].state = 0;
				}
			}
		}
		
		for (var i = 0; i < points.length; i++) {
			if (points[i].x + VARGLOB.direction > 0 && points[i].x + VARGLOB.direction < SETTINGS.gameFiled.x-1) {
				if (VARGLOB.gameCell[points[i].y + VARGLOB.down][points[i].x + VARGLOB.direction].state === 2) {
					if (VARGLOB.lastDirection === 'left') {
						VARGLOB.direction++;
					} else {
						VARGLOB.direction--;
					}
				}
			}
			
			if (points[i].x + VARGLOB.direction < 0 || points[i].x + VARGLOB.direction > SETTINGS.gameFiled.x-1) {
				if (points[i].x + VARGLOB.direction < 0) {
					VARGLOB.direction++;
				} else {
					VARGLOB.direction--;
				}
				return;
			} else {
				
				if (points[i].y + VARGLOB.down === SETTINGS.gameFiled.y-1 || VARGLOB.gameCell[points[i].y + VARGLOB.down+1][points[i].x + VARGLOB.direction].state === 2) {
					VARGLOB.gameCell[points[i].y + VARGLOB.down][points[i].x + VARGLOB.direction].state = 1;
					VARGLOB.gameCell[points[i].y + VARGLOB.down][points[i].x + VARGLOB.direction].color = VARGLOB.currentColor;
					handleGame(points);
					return;
				} else {
					VARGLOB.gameCell[points[i].y + VARGLOB.down][points[i].x + VARGLOB.direction].state = 1;
					VARGLOB.gameCell[points[i].y + VARGLOB.down][points[i].x + VARGLOB.direction].color = VARGLOB.currentColor;
				}
			}
		}
		draw();
	}
}

function setColor () {
	return COLORS[rand(COLORS.length)];
}

function handleGame(points) {
	for (var i = 0; i < points.length; i++) {
		VARGLOB.gameCell[points[i].y + VARGLOB.down][points[i].x + VARGLOB.direction].state = 2;
		VARGLOB.gameCell[points[i].y + VARGLOB.down][points[i].x + VARGLOB.direction].color = VARGLOB.currentColor;
	}
	
	var line = true;
	for (var y = 0; y < SETTINGS.gameFiled.y; y++) {
		for (var x = 0; x < SETTINGS.gameFiled.x; x++) {
			if (VARGLOB.gameCell[y][x].state === 2) {
				line = true;
				numLine = y;
			} else {
				line = false;
				break;
			}
		}
		
		if(line) {
			clearLine(numLine);
		} else {
			line = false;
		}
	}
	
	for (var y = 0; y < SETTINGS.gameFiled.y; y++) {
		for (var x = 0; x < SETTINGS.gameFiled.x; x++) {
			if (VARGLOB.gameCell[y][x].state === 2 && y === 0) {
				var flag = true;
			}
		}
	}
	
	if (flag) {
		down('end');
	} else {
		down('clear');
	}
	
	function clearLine (line) {
		for (var x = 0; x < SETTINGS.gameFiled.x; x++) {
			VARGLOB.gameCell[line][x].state = 0;
		}
		
		for (var y = SETTINGS.gameFiled.y-1; y > 0; y--) {
			if (y < line) {
				for (var x = 0; x < SETTINGS.gameFiled.x; x++) {
					if (VARGLOB.gameCell[y][x].state === 2) {
						VARGLOB.gameCell[y][x].state = 0;
						VARGLOB.gameCell[y+1][x].state = 2;
						VARGLOB.gameCell[y+1][x].color = VARGLOB.gameCell[y][x].color;
					}
				}
			}
		}
		
		scoreHandler();
	}
}

function linkEvents () {
	
	VARGLOB.linkStart.on('click', function(e) {
		e.preventDefault();
		gameControl();
	});
	
	VARGLOB.linkStop.on('click', function(e) {
		e.preventDefault();
		down('end');
	});
	
	VARGLOB.linkRestart.on('click', function(e) {
		jQuery(this).toggleClass('active');
		e.preventDefault();
		down('end');
		gameControl();
		
	});
}

function draw(end) {
	var items = VARGLOB.elements;
	items.removeClass(CLASSES.state);
	items.removeClass(VARGLOB.currentColor);
	
	if(end === 'end') {
		return;
	}
	
	for (var y = 0; y < SETTINGS.gameFiled.y; y++) {
		for (var x = 0; x < SETTINGS.gameFiled.x; x++) {
			
			if(VARGLOB.gameCell[y][x].state === 1 || VARGLOB.gameCell[y][x].state === 2) {
				jQuery.each(items, function(key, elem){
					var elem = jQuery(elem);
					if (parseFloat(elem.attr('x')) === x && parseFloat(elem.attr('y')) === y) {
						elem.addClass(CLASSES.state);
						
						for (var i = 0; i < COLORS.length; i++) {
							if (elem.hasClass(COLORS[i])) {
								elem.removeClass(COLORS[i]);
							}
						}
						
						elem.addClass(VARGLOB.gameCell[y][x].color);
						elem.attr('state',VARGLOB.gameCell[y][x].state);
					}
				});
			}
		}
	}
	
	VARGLOB.flag = false;
}

function gameEvents () {
	VARGLOB.body.on('keydown', function(e) {
		e.stopPropagation();
		
		if (VARGLOB.pause) {
			down('pause');
			return;
		}
		
		switch(e.keyCode) {
			case 38:
				rotate(sendResponce('figurePosition'));
				break;
			case 37:
				move('left');
				break;
			case 39:
				move('right');
				break;
			case 40:
				VARGLOB.down++;
				setState(sendResponce('setState.pos'),sendResponce('setState.figure'));
				break;
			case 32:
				down('pause');
				break;
		}
	});
}

function selectFigures(figures) {
	return figures[rand(figures.length-1)];
}

function rand(max) {
	var min = 0;
	return min + Math.floor(Math.random() * (max + 1 - min));
}

function move(direction) {
	if (VARGLOB.flag) {
		return;
	}
	VARGLOB.flag = true;
	
	switch(direction) {
		case 'left':
			VARGLOB.direction--;
			break;
		case 'right':
			VARGLOB.direction++;
			break;
	}
	
	VARGLOB.lastDirection = direction;
	setState(sendResponce('setState.pos'),sendResponce('setState.figure'));
}

function rotate(positions) {
	if (VARGLOB.currentPos === positions.length-1) {
		VARGLOB.currentPos = 0;
	} else {
		VARGLOB.currentPos++;
	}
	
	setState(sendResponce('setState.pos'),sendResponce('setState.figure'));
}

function currentLevel () {
	return SETTINGS.levelSpeed-(VARGLOB.level*SETTINGS.levelStep);
}

function setLevel () {
	VARGLOB.level++;
	
	if (VARGLOB.level > SETTINGS.maxLevel) {
		VARGLOB.level = SETTINGS.maxLevel;
	}
	
	VARGLOB.levelHolder.text(VARGLOB.level);
}

function scoreHandler () {
	VARGLOB.score = VARGLOB.score + SETTINGS.scoreStep;
	VARGLOB.scoreHolder.text(VARGLOB.score);
	if (VARGLOB.score%SETTINGS.levelUp == 0) {
		setLevel();
	}
}