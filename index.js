const sprites = {
    "platform": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAYElEQVR4AeyRUQ7AIAhDyy7JGTmla2XzZ8lUvjUUJDZPgxdyNZaKIEBzd1SkSwVgrYcAFhGQVjHySvSbAKwwpgHS4Z/kfdRnwP2IDmI3q7RkvC/IrpAPAJ9f2B7jGSJwAwAA///jHxP+AAAABklEQVQDADsyOiHfZ+sXAAAAAElFTkSuQmCC",
    "spike": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAk0lEQVR4AbSQgQ2AIAwEi3OxBzOyB3tpTwuJEQoh0fAW6fdaOeR5Tg07EgBnSkl2RFMAGvcXgJBzFrSKwYvUHwBolKCvBiLpCa/pvgPdtwVISildmev22P4DqOfLsf7CtCDGiOfVnYNlAOaefgEEG7c1tO/P+BhGEzSIV+wByC1pNAHFdYru6BiQByA/1Qzgdod+AQAA//+QWHAuAAAABklEQVQDAIB2TCEb4tngAAAAAElFTkSuQmCC",
    "character": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA0UlEQVR4AcxQsQ0CMQx0fgQKFmAKJETFBFRIDPCIgZAYAAkaJqBkDRiAgor6gy+SI/udoJdo/qWLz5fLOZ+G/vyqAfvVNAp+zSgG4ODh9krnUNGnprC4ADFzTXZVYxJ6iwvgiUE8zIUS86xnkYkLYC2bZboc5t7dohiwae/xPbuSAD2C0aNqmAAYAW0QXtNNAMzn46L4r9ABeDRMwOSx1nuDuAmQx7p8ltRHLc0EwBS2TXrpeOqCQOvgGi5Abw7hIwvYzSm2z44AfX30APa1Dv4FAAD//6BWESYAAAAGSURBVAMA5WVb4Zedhd4AAAAASUVORK5CYII=",
}

var state = {
    "floors": {},
    "character": {
        y: 3,
        x: 3,
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

    //requestAnimationFrame(loop)
    setTimeout(loop, 10)
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

    // Autoscroll (screen)
    // Speeds up as you go up. 7 should be the max speed
    const targets = [
        [0, 0.1],
        [10, 1],
        [30, 2],
        [50, 3],
        [100, 4],
        [200, 5],
        [300, 6],
        [500, 7],
        [99999999, 8],
    ]
    for (var i=0; i<targets.length-1; i++) {
        const fraction = (state.character.y - targets[i][0]) / (targets[i+1][0]-targets[i][0])
        if (fraction < 0 || fraction > 1) continue
        const min = targets[i][1]
        const max = targets[i+1][1]
        state.scrollSpeed = min + (max-min)*fraction
    }
    state.bottom += elapsed * state.scrollSpeed
    state.bottom = Math.max(state.character.y - MAX_BOTTOM_DISTANCE, state.bottom)

    state.score = Math.max(Math.floor(state.character.y), state.score)

    if (state.character.y < state.bottom) {
        character.dead = true
    }

    // Conveyoring (floors)
    for (var floorNum of Object.keys(state.floors)) {
        const floor = state.floors[floorNum]
        floor.offset_x += floor.velocity_x * elapsed

        while (floor.offset_x >= 1) {
            floor.offset_x -= 1
            // Move the rightmost thing to the left
            const removed = floor.things.splice(floor.things.length-1, 1)
            floor.things.splice(0, 0, ...removed)
        }
        while (floor.offset_x <= -1) {
            floor.offset_x += 1
            // Move the leftmost thing to the right
            const removed = floor.things.splice(0, 1)
            floor.things.splice(floor.things.length, 0, ...removed)
        }
    }


    // Add off top of screen
    topVisible = state.bottom + 16
    for (var floorNum of wholeNumbersBetween(state.bottom, state.bottom+16)) {
        if (!state.floors[floorNum]) generateFloor(floorNum)
    }

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
            // Priority list: down-spike, platform, empty
        }
    } else {
        startY -= 1 // Character height
        // Fall down
        // Whole numbers between (startY + dist) and startY
        for (const whole of wholeNumbersBetween(startY + dist, startY).reverse()) {
            const floor = getFloor(whole)
            var x = state.character.x - floor.offset_x // Compensate for scrolling
            x = Math.floor(x)
            // Priority list: up-spike, platform, empty
            var thing = floor.things[x] // TODO: Deal with straddling later
            if (!thing) continue
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
        return {
            things: ["empty", "empty", "empty", "empty"],
            offset_x: 0,
            velocity_x: 0,
        }
    }
}

function renderTick(elapsed) {
    // Render platforms
    const bottomFloor = Math.floor(state.bottom)
    for (var floorOffset=0; floorOffset<16; ++floorOffset) {
        const floorNum = bottomFloor + floorOffset
        const floor = getFloor(floorNum)
        for (var i=0; i<floor.things.length; i++) {
            var thing = floor.things[i]
            if (typeof(thing) == 'string') {
                thing = {
                    sprite: thing,
                    e: $(`<div class="sprite ${thing}"></div>`),
                }
                floor.things[i] = thing
                $(".playarea").append(thing.e)
            }
            const pos = {
                x: i + floor.offset_x,
                y: floorNum-state.bottom,
            }
            thing.e.css({
                "--x": pos.x,
                "--y": pos.y,
            })
        }
    }
    // Remove stuff off the bottom
    for (var floorNum of Object.keys(state.floors)) {
        if (floorNum < state.bottom-1) { // Off the bottom?
            for (var thing of state.floors[floorNum].things) {
                if (thing.e) thing.e.remove()
            }
            delete state.floors[floorNum]
        }
    }

    // Render character
    if ($(".sprite.character").length == 0) {
        $(".playarea").append($('<div class="sprite character"></div>'))
    }
    const character = $(".sprite.character")
    character.css({
        "--x": state.character.x,
        "--y": state.character.y-state.bottom,
    })

    $(".score").text(state.score)

    if (state.character.dead) {
        $(".dead-modal").show()
        $(".character").addClass("dead")
    }

    // Fadeout of platforms toward the edges of the tower
}

function generateFloor(i) {
    const floor = {
        things: [],
        velocity_x: 0,
        offset_x: 0,
    }
    state.floors[i] = floor

    const dirRNG = Math.random()
    if (dirRNG > 0.3) {
        floor.velocity_x = 0
    } else if (dirRNG < 0.15) {
        floor.velocity_x = 1
    } else {
        floor.velocity_x = -1
    }
        

    for (var n = 0; n<7; n++) {
        if (i%2) { 
            floor.things.push("empty")
        } else {
            // Generate stuff
            floor.things.push("platform")
        }
    }
}

function main() {
    for (var i=0; i<16; ++i) generateFloor(i)

    requestAnimationFrame(loop)

    // Bind jump key (spacebar)
    // Bind tapping "Jump"
    var jumpMouse = false
    var jumpKeyboard = false
    function updateJump() { jump(jumpMouse | jumpKeyboard); }
    $(document).on("mouseup",    () => { jumpMouse = false; updateJump(); })
    $(".button").on("mousedown", () => { jumpMouse = true; updateJump(); })
    $(document).on("touchend",    () => { jumpMouse = false; updateJump(); })
    $(".button").on("touchstart", (e) => { jumpMouse = true; updateJump(); e.preventDefault(); })
    $(document).on("keyup",      () => { jumpKeyboard = false; updateJump(); })
    $(document).on("keydown",    (e) => {
        const ev = e.originalEvent
        if (ev.code == "Space" || ev.code == "ArrowUp") {
            jumpKeyboard = true;
            updateJump();
        }
    })
}

main()
