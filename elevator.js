{
    init: function(elevators, floors) {
        var loop = 0;
        var callCount = 0;
        console.clear();
        for(var i = 0; i < floors.length; i++) {
            floors[i].up = false;
            floors[i].down = false;
            floors[i].elevatorUP = -1;
            floors[i].elevatorDOWN = -1;
        }
        function resetElevator(elevator) {
            elevator.goingDownIndicator(true);
            elevator.goingUpIndicator(true);
            elevator.status = "idle";
        }

        function addToRide(floorNum, elevator) {
            if(elevator.goingUpIndicator()==true && elevator.goingDownIndicator()==true) {
                console.log(`[ERROR ADD TO RIDE] ${floorNum}`);
            } else if (elevator.goingUpIndicator()==true) {
                elevator.goToFloor(floorNum);
                elevator.destinationQueue.sort(function(a, b){return a-b});
                elevator.checkDestinationQueue();
            } else if (elevator.goingDownIndicator()==true) {
                elevator.goToFloor(floorNum);
                elevator.destinationQueue.sort(function(a, b){return b-a});
                elevator.checkDestinationQueue();
            }

        }
        
        function pileCall(floorNum, direction, callCount) {
            console.log(`[Pile Call] ${floorNum}${direction}`);
            loop ++;
            if (loop > 1000) {
                console.log(`loop`);
            }            
            if(direction === "up") {
                floors[floorNum].up = true;
                floors[floorNum].callCountUP = callCount;
            } else if (direction === "down") {
                floors[floorNum].down = true;
                floors[floorNum].callCountDOWN = callCount;
            }
        }

        function registerCall(floorNum, direction, elevator) {
            switch (elevator.status) {
                case 'idle':
                    if (direction == "up") {
                        console.log(`[Catch Go UP Called] ${floorNum}`);
                        elevator.goingDownIndicator(false);
                        elevator.goingUpIndicator(true);
                        floors[floorNum].elevatorUP = elevator.id;
                    } else if (direction == "down"){
                        elevator.goingDownIndicator(true);
                        elevator.goingUpIndicator(false);
                        floors[floorNum].elevatorDOWN = elevator.id;
                        console.log(`[Catch Go Down Called] ${floorNum}`);
                    }
                    elevator.status = "catch";
                    addToRide(floorNum, elevator);
                    return true;
                case 'deliver':
                    if (direction == "up") {
                        console.log(`[Opport Catch UP Called] ${floorNum} ${elevator.id}`);
                        floors[floorNum].elevatorUP = elevator.id;
                    } else if (direction == "down"){
                        console.log(`[Opport Catch DOWN Called] ${floorNum} ${elevator.id}`);
                        floors[floorNum].elevatorDOWN = elevator.id;
                    }
                    addToRide(floorNum, elevator);
                    return false;
                case 'catch':
                    console.log(`[ERROR] NO REGISTER CALL IN CATCH`);
                    return false;
            }
            return false;

        }

        function unpile(elevator) {
            console.log(`[UnPile]`);
            var call = new Object();
            var floorMaxDOWN = Math.max.apply(Math,floors.map(function(o){ if((o.elevatorDOWN==-1) && (o.down == true))  {return floors.indexOf(o);} else {return -2*floors.length;}}));
            var floorMinUP = Math.min.apply(Math,floors.map(function(o){ if((o.elevatorUP==-1) && (o.up == true)) {return floors.indexOf(o);} else {return 2*floors.length;}}));
            if(Math.abs(elevator.currentFloor() - floorMaxDOWN) < Math.abs(elevator.currentFloor() - floorMinUP)) {
                if (floorMaxDOWN < floors.length && floorMaxDOWN >= 0) {
                    registerCall(floorMaxDOWN, "down", elevator);
                } else {
                    console.log(`[UNPILE] Nothing to do ${elevator.id}`);
                }
            } else {
                if (floorMinUP >= 0 && floorMinUP < floors.length) {
                    registerCall(floorMinUP, "up", elevator);
                } else {
                    console.log(`[UNPILE] Nothing to do ${elevator.id}`);
                }
            }
        }
        
        function unpileCall(floorNum, direction, elevator) {
            switch (elevator.status) {
                case 'deliver' :
                case 'catch':
                    if(elevator.goingDownIndicator() && elevator.goingUpIndicator()) {
                        console.log(`[Error UnPileCall] Direction is not set`);
                    } else if (elevator.goingDownIndicator()) {
                        floors[floorNum].down = false;
                        if((floors[floorNum].elevatorDOWN != -1) && (floors[floorNum].elevatorDOWN != elevator.id)) {
                            var resetedElevator = elevators[floors[floorNum].elevatorDOWN];
                            console.log(`[Reset Elevator] ${resetedElevator.id}`);
                            resetElevator(resetedElevator);
                            unpile(resetedElevator);
                        }
                        floors[floorNum].elevatorDOWN = -1;
                        floors[floorNum].callCountDOWN = -1;
                    } else if (elevator.goingUpIndicator()) {
                        floors[floorNum].up = false;
                        if((floors[floorNum].elevatorUP != -1) && (floors[floorNum].elevatorUP != elevator.id)) {
                            var resetedElevator = elevators[floors[floorNum].elevatorUP];
                            console.log(`[Reset Elevator] ${resetedElevator.id}`);
                            resetElevator(resetedElevator);
                            unpile(resetedElevator);
                        }
                        floors[floorNum].elevatorUP = -1;
                        floors[floorNum].callCountUP = -1;
                    }
                    break;
                case 'idle' :
                    break;
            }
        }
        
        // Whenever the elevator is idle (has no more queued destinations) ...
        elevators.forEach((elevator, index) => {
            elevator.id = index;
            elevator.status = "idle";
            elevator.personWeigth = 1 / elevator.maxPassengerCount();
            elevator.on("idle", function() {
                // let's go to all the floors (or did we forget one?)
                if(elevator.status == "deliver") {
                    resetElevator(elevator);
                }
                unpile(elevator);
            });
            elevator.on("floor_button_pressed", function(floorNum) {
                if(addToRide(floorNum, elevator) == false) {
                    console.log(`[ERROR NO GO Destination] ${floorNum}${elevator}`);
                } else {
                    console.log(`[Go To]${floorNum}`);
                    elevator.status = "deliver";
                }
            });
            elevator.on("passing_floor", (floorNum, direction) => {
                //console.log(`Passing Floor ${floorNum} ${direction} ${elevator.id}`);
                switch (elevator.status) {
                    case 'deliver' :
                        //Opportunity Catch
                        if(elevator.goingDownIndicator() && elevator.goingUpIndicator()) {
                            console.log(`[Error Passing Floor] Direction is not set`);
                        } else if (elevator.loadFactor() < (0.85-elevator.personWeigth)) {
                            //Space available in elevator
                            if (elevator.goingDownIndicator() && (floors[floorNum].down == true)) {
                                //Going Down
                                if(floors[floorNum].elevatorDOWN == -1 || floors[floorNum].elevatorDOWN == elevator.id) {
                                    console.log(`Passing Floor Opportunity Catch Down ${floorNum} ${elevator.id} ${elevator.loadFactor()}`);
                                    addToRide(floorNum, elevator); 
                                }
                            } else if (elevator.goingUpIndicator() && (floors[floorNum].up == true)) {
                                //Going Up
                                if(floors[floorNum].elevatorUP == -1 || floors[floorNum].elevatorUP == elevator.id) {
                                    console.log(`Passing Floor Opportunity Catch Up ${floorNum} ${elevator.id} {elevator.loadFactor()}`);
                                    addToRide(floorNum, elevator); 
                                }
                            } else {
                                console.log(`catch scheduled UP by ${floors[floorNum].elevatorUP}, DOWN ${floors[floorNum].elevatorDOWN}`);
                            }
                        } else {
                            console.log(`[Elevator FULL ?!] ${elevator.loadFactor()}`);
                        }
                        break;
                }
            });
            elevator.on("stopped_at_floor", (floorNum, direction) => {
                //console.log(`Stopped Floor ${floorNum} ${direction} ${elevator.id}`);
                unpileCall(floorNum, direction, elevator);                
            });
        });

        floors.forEach((floor) => {
            const floorNum = floor.floorNum();
            floor.on("up_button_pressed", () => {
                callCount ++;
                console.log(`floor${floorNum} [up_button_pressed]`);
                var isAccepted = false;
                var i = 0;
                while (!isAccepted && i < elevators.length) {
                    if(elevators[i].status == 'idle') {
                        isAccepted = registerCall(floorNum, "up", elevators[i]);
                    }
                    i++;
                }
                pileCall(floorNum, "up", callCount);
            });
            floor.on("down_button_pressed", () => {
                callCount ++;
                console.log(`floor${floorNum} [down_button_pressed]`);
                var isAccepted = false;
                var i = 0;
                while (!isAccepted && i < elevators.length) {
                    if(elevators[i].status == 'idle') {
                        isAccepted = registerCall(floorNum, "down", elevators[i]);  
                    }
                    i++;
                }
                pileCall(floorNum, "down", callCount);
            });

        });
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}
