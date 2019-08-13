{
    init: function(elevators, floors) {
        var elevator = elevators[0]; // Let's use the first elevator
        var callList = [];
        var loop = 0;

        function addToRide(floorNum) {
            if(elevator.goingUpIndicator()==true && elevator.goingDownIndicator()==true) {
                console.log(`[ERROR ADD TO RIDE] ${floorNum}`);
            } else if (elevator.goingUpIndicator()==true) {
                elevator.goToFloor(floorNum);
                elevator.destinationQueue.sort();
                elevator.checkDestinationQueue();
            } else if (elevator.goingDownIndicator()==true) {
                elevator.goToFloor(floorNum);
                elevator.destinationQueue.sort(function(a, b){return b-a});
                elevator.checkDestinationQueue();
            }

        }

        function isItemInArray(array, item) {
            for (var i = 0; i < array.length; i++) {
                // This if statement depends on the format of your array
                if (array[i][0] == item[0] && array[i][1] == item[1] && array[i][2] == item[2]) {
                    console.log(`[WARNING Double Call] ${item}`);
                    return false;   // Found it
                }
            }
            return false;   // Not found
        }
        
        function pileCall(floorNum, direction) {
            console.log(`[Pile Call] ${floorNum}${direction} size:${callList.length+1}`);
            loop ++;
            if (loop > 1000) {
                console.log(`loop`);
            }
            if(direction == "up" && isItemInArray(callList, [floorNum, 1, 0]) == false){
                callList.push([floorNum, 1, 0]);
            } else if(direction == "down" && isItemInArray(callList, [floorNum, 0, 1]) == false) {
                callList.push([floorNum, 0, 1]);
            }
        }

        function registerCall(floorNum, direction) {
            if(elevator.goingUpIndicator()==true && elevator.goingDownIndicator()==true) {
                if (direction == "up") {
                    console.log(`[Will Go UP Called] ${floorNum}`);
                    elevator.goingDownIndicator(false);
                    elevator.goingUpIndicator(true);
                } else if (direction == "down"){
                    elevator.goingDownIndicator(true);
                    elevator.goingUpIndicator(false);
                    console.log(`[Will Go Down Called] ${floorNum}`);
                }
                addToRide(floorNum);
            } else if (elevator.goingUpIndicator()==true && direction =="up" && 
                       Math.min(elevator.currentFloor(), elevator.destinationQueue[0]) < floorNum) {
                console.log(`[Opport Catch UP] ${floorNum}`);
                addToRide(floorNum);     
            } else if (elevator.goingDownIndicator()==true && direction =="down" && 
                       Math.max(elevator.currentFloor(), elevator.destinationQueue[0]) > floorNum) {
                console.log(`[Opport Catch Down] ${floorNum}`);
                addToRide(floorNum); 
            } else {
                pileCall(floorNum, direction);
            }

        }

        function unpileCall() {
            console.log(`[UnPile]`);
            var nbCall = 0;
            //If was going up try to find someone going down
            if(elevator.goingUpIndicator()) {
                callList.sort(function(a, b) {
                    return b[0] - a[0];
                });
                console.log(`Trying to go down`);
                for (var i = 0; i < callList.length; i++) {
                    if (callList[i][2] === 1){
                        if(nbCall == 0) {
                            elevator.goingDownIndicator(true);
                            elevator.goingUpIndicator(true);
                        }
                        var floorCalling = callList[i][0]
                        callList.splice(i,1);
                        if(i>0) {i--};
                        registerCall(floorCalling, "down");
                        nbCall++;
                    }
                }
            }
            //If was going down try to find someone going up
            if(elevator.goingDownIndicator() && nbCall == 0) {
                callList.sort(function(a, b) {
                    return a[0] - b[0];
                });
                console.log(`Trying to go up`);
                for (var i = 0; i < callList.length; i++) {
                    if (callList[i][1] === 1){
                        if(nbCall == 0) {
                            elevator.goingDownIndicator(true);
                            elevator.goingUpIndicator(true);
                        }
                        var floorCalling = callList[i][0]
                        callList.splice(i,1);
                        if(i>0) {i--};
                        registerCall(floorCalling, "up");
                        nbCall++;
                    }
                }
            }
            if(nbCall == 0) {
                elevator.goingDownIndicator(true);
                elevator.goingUpIndicator(true);
                if(callList.length > 0) {
                    console.log(`[No Optimised call take the first] ${callList}`);
                    var floorCalling = callList[0][0]
                    if(callList[0][1] ===1) {
                        callList.splice(0,1);
                        registerCall(floorCalling, "up");
                    } else {
                        callList.splice(0,1);
                        registerCall(floorCalling, "down");
                    }
                }

            }
        }
        // Whenever the elevator is idle (has no more queued destinations) ...
        elevator.on("idle", function() {
            // let's go to all the floors (or did we forget one?)
            unpileCall();
        });

        elevator.on("floor_button_pressed", function(floorNum) {
            addToRide(floorNum);
            console.log(`[Go To]${floorNum}`);
        });
        floors.forEach((floor) => {
            const floorNum = floor.floorNum();

            floor.on("up_button_pressed", () => {
                console.log(`floor${floorNum} [up_button_pressed]`);
                registerCall(floorNum, "up");
            });
            floor.on("down_button_pressed", () => {
                console.log(`floor${floorNum} [down_button_pressed]`);
                registerCall(floorNum, "down");
            });
        });
    },
        update: function(dt, elevators, floors) {
            // We normally don't need to do anything here
        }
}
