const sprites = {
    "platform": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAYElEQVR4AeyRUQ7AIAhDyy7JGTmla2XzZ8lUvjUUJDZPgxdyNZaKIEBzd1SkSwVgrYcAFhGQVjHySvSbAKwwpgHS4Z/kfdRnwP2IDmI3q7RkvC/IrpAPAJ9f2B7jGSJwAwAA///jHxP+AAAABklEQVQDADsyOiHfZ+sXAAAAAElFTkSuQmCC",
    "spike": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAk0lEQVR4AbSQgQ2AIAwEi3OxBzOyB3tpTwuJEQoh0fAW6fdaOeR5Tg07EgBnSkl2RFMAGvcXgJBzFrSKwYvUHwBolKCvBiLpCa/pvgPdtwVISildmev22P4DqOfLsf7CtCDGiOfVnYNlAOaefgEEG7c1tO/P+BhGEzSIV+wByC1pNAHFdYru6BiQByA/1Qzgdod+AQAA//+QWHAuAAAABklEQVQDAIB2TCEb4tngAAAAAElFTkSuQmCC",
    "character": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA0UlEQVR4AcxQsQ0CMQx0fgQKFmAKJETFBFRIDPCIgZAYAAkaJqBkDRiAgor6gy+SI/udoJdo/qWLz5fLOZ+G/vyqAfvVNAp+zSgG4ODh9krnUNGnprC4ADFzTXZVYxJ6iwvgiUE8zIUS86xnkYkLYC2bZboc5t7dohiwae/xPbuSAD2C0aNqmAAYAW0QXtNNAMzn46L4r9ABeDRMwOSx1nuDuAmQx7p8ltRHLc0EwBS2TXrpeOqCQOvgGi5Abw7hIwvYzSm2z44AfX30APa1Dv4FAAD//6BWESYAAAAGSURBVAMA5WVb4Zedhd4AAAAASUVORK5CYII=",
}

var state = {
    "floors": {
        0: ["platform", "spike", "platform", "spike", "platform"],
        1: ["empty", "empty", "empty", "empty", "empty"],
        2: ["platform", "spike", "spike", "platform", "platform"],
        3: ["empty", "empty", "empty", "empty", "empty"],
        4: ["platform", "platform", "platform", "platform", "platform"],
        5: ["empty", "empty", "empty", "empty", "empty"],
        6: ["platform", "platform", "platform", "platform", "platform"],
        7: ["empty", "empty", "empty", "empty", "empty"],
        8: ["platform", "platform", "platform", "platform", "platform"],
        9: ["empty", "empty", "empty", "empty", "empty"],
    },
    "character": {
        y: 1,
        x: 2,
        velocity_y: 0,
        jumpState: {
            jumping: false,
            timeHeld: 0,
            released: true,
            ready: true,
        },
        dead: false,
    },
    "scrollSpeed": 0.1,
    "bottom": 0,
    "score": 0,
}

var ts = new Date()
function loop() {
    const ts2 = new Date()
    elapsed = (ts2 - ts)/1000
    ts = ts2

    renderTick(elapsed)
    physicsTick(elapsed)

    requestAnimationFrame(loop)
}

function jump(enabled) {
    const jumpState = state.character.jumpState
    if (!enabled) {
        jumpState.released = true
    }
    if (jumpState.jumping && !enabled) { // On release
        jumpState.jumping = enabled
    } else if (enabled && !jumpState.jumping && jumpState.ready && jumpState.released) { // On initial press
        jumpState.jumping = enabled
        jumpState.ready = false
        jumpState.released = false
        jumpState.timeHeld = 0
    }

}

const MAX_JUMP_TIME = .19
const JUMP_ACC = 100
const FALL_ACC = -JUMP_ACC * .8
const MAX_BOTTOM_DISTANCE = 6
function physicsTick(elapsed) {
    if (state.character.dead) {
        return
    }

    const character = state.character
    const jumpState = state.character.jumpState
    if (jumpState.jumping) {
        // Do jump up
        character.velocity_y += JUMP_ACC * elapsed
    } else {
        // Do fall
        character.velocity_y += FALL_ACC * elapsed
    }
    var thing = null
    var dist  = state.character.velocity_y * elapsed
    const res = testCollision(state.character.y, dist)
    thing = res[0]
    dist = res[1]

    if (thing == "spike" && dist > 0) {
        // TODO: Check for upwards spike collision. If there is one, explode the character.
        // explode()
        //character.dead = true
    } else if (thing == "platform" || thing == "spike") {
        // Check for downwards floor collision. If there is one, reduce distance and set "ready" on jumpState
        jumpState.ready = true
        character.velocity_y = 0
    }

    character.y += dist

    // Update jump state
    if (jumpState.jumping) {
        jumpState.timeHeld += elapsed
    }
    if (jumpState.jumping && jumpState.timeHeld > MAX_JUMP_TIME) {
        jumpState.jumping = false
    }

    // Autoscroll
    state.bottom += elapsed * state.scrollSpeed
    state.bottom = Math.max(state.character.y - MAX_BOTTOM_DISTANCE, state.bottom)

    state.score = Math.max(Math.floor(state.character.y), state.score)

    if (state.character.y < state.bottom) {
        character.dead = true
    }

    // TODO: Scrolling, add/remove off top/bottom of screen

}

function wholeNumbersBetween(x, y) {
    const res = []
    for (var i=Math.ceil(x); i<=Math.floor(y); i++) {
        res.push(i)
    }
    return res
}

function testCollision(startY, dist) {
    if (dist > 0) {
        // Jump up
        // Whole numbers between startY and (startY + dist)
        for (const whole of wholeNumbersBetween(startY, startY + dist)) {
            //const dist = whole - startY
        }
    } else {
        startY -= 1 // Character height
        // Fall down
        // Whole numbers between (startY + dist) and startY
        for (const whole of wholeNumbersBetween(startY + dist, startY).reverse()) {
            const floor = getFloor(whole)
            var thing = floor[state.character.x] // TODO: Deal with straddling later
            if (thing.sprite) thing = thing.sprite
            if (thing == "empty") continue
            return [thing, whole-startY]
        }
    }

    return [null, dist]

}

function getFloor(floorNum) {
    if (state.floors[floorNum]) return state.floors[floorNum]
    else {
        return ["empty", "empty", "empty", "empty"]
    }
}

function renderTick(elapsed) {
    // Render platforms
    const bottomFloor = Math.floor(state.bottom)
    for (var floorOffset=0; floorOffset<10; ++floorOffset) {
        const floorNum = bottomFloor + floorOffset
        const floor = getFloor(floorNum)
        for (var i=0; i<floor.length; i++) {
            var thing = floor[i]
            if (typeof(thing) == 'string') {
                thing = {
                    sprite: thing,
                    e: $(`<div class="sprite ${thing}"></div>`),
                }
                floor[i] = thing
                $(".playarea").append(thing.e)
            }
            const pos = {
                x: i,
                y: floorNum-state.bottom,
            }
            thing.e.css({
                "--x": pos.x,
                "--y": pos.y,
            })
        }
    }
    // TODO: Remove stuff off the bottom

    // Render character
    if ($(".sprite.character").length == 0) {
        $(".playarea").append($('<div class="sprite character"></div>'))
    }
    const character = $(".sprite.character")
    character.css({
        "--x": 2,
        "--y": state.character.y-state.bottom,
    })

    $(".score").text(state.score)

    if (state.character.dead) {
        $(".dead").show()
    }

    // Fadeout of platforms toward the edges of the tower
}

function main() {
    requestAnimationFrame(loop)

    // Bind jump key (spacebar)
    // Bind tapping "Jump"
    var jumpMouse = false
    var jumpKeyboard = false
    function updateJump() { jump(jumpMouse | jumpKeyboard); }
    $(document).on("mouseup",    () => { jumpMouse = false; updateJump(); })
    $(".button").on("mousedown", () => { jumpMouse = true; updateJump(); })
    $(document).on("keyup",      () => { jumpKeyboard = false; updateJump(); })
    $(document).on("keydown",    (ev) => {
        ev = ev.originalEvent
        if (ev.code == "Space") {
            jumpKeyboard = true;
            updateJump();
        }
    })
}

main()
