#!/usr/bin/env python

# Jacqueline Kory Westlund
# Caitlyn Elise Clabaugh
# August 2016
#
# The MIT License (MIT)
#
# Copyright (c) 2016 Personal Robots Group
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

import rospy
from sar_game_command_msgs.msg import GameCommand
from std_msgs.msg import Header
import argparse

def game_command_sender():
    """ SAR Game Command Sender uses ROS to send game command messages
    to a SAR robot via the /sar/game_command topic.
    """
    # Parse python arguments.
    parser = argparse.ArgumentParser(
            formatter_class=argparse.RawDescriptionHelpFormatter,
            description='Send a message to a SAR game. Must have roscore '
            + 'running for message to be sent.')
    # Specify the command to send.
    parser.add_argument('command', type=str,
            choices=['start', 's', 'continue', 'c', 'pause', 'p', 'end', 'e', 'wait', 'w', 'skip', 'k'],
            help="Specify the command to send.")
    # Specify game to send message to.
    parser.add_argument('-g', '--game', dest='game', type=str, nargs='+', default='s',
            choices=['storytelling', 's', 'rocket_barrier', 'r', 'galactic_traveler', 'g', 'spaceship_tidyup', 't', 'alien_codes', 'a'],
            help="Which game to send the message to.")
    # START commands should be accompanied by an integer specifying
    # which level the game should start at.
    parser.add_argument('-l', '--level', dest='level', type=int, nargs=1, default=1,
            help="The level the game should start at.")

    args = parser.parse_args()
    print(args)

    # Now build a message based on the command. Open ROS here, then run
    # run through the below to build message, and send at the end.

    # Start ROS node.
    pub = rospy.Publisher('sar/game_command', GameCommand, queue_size=10)
    rospy.init_node('game_command_sender', anonymous=True)
    r = rospy.Rate(10) # spin at 10 Hz
    r.sleep() # sleep to wait for subscribers

    # Start building message.
    msg = GameCommand()
    msg.header = Header()
    msg.header.stamp = rospy.Time.now()

    # Determine which command to send.
    if args.command:
        if args.command == 'start' or args.command == 's':
            msg.command = GameCommand.START
        elif args.command == 'continue' or args.command == 'c':
            msg.command = GameCommand.CONTINUE
        elif args.command == 'pause' or args.command == 'p':
            msg.command = GameCommand.PAUSE
        elif args.command == 'end' or args.command == 'e':
            msg.command = GameCommand.END
        elif args.command == 'wait' or args.command == 'w':
            msg.command = GameCommand.WAIT_FOR_RESPONSE
        elif args.command == 'skip' or args.command == 's':
            msg.command = GameCommand.SKIP_RESPONSE

    # Check whether we were given a level or not.
    if args.level:
        msg.level = args.level[0]

    # Determine which game to send to.
    if args.game:
        game = args.game[0]
        if game == 'storytelling' or game == 's':
            msg.game = GameCommand.STORYTELLING
        elif game == 'rocket_barrier' or game == 'r':
            msg.game = GameCommand.ROCKET_BARRIER
        elif game == 'galactic_traveler' or game == 'g':
            msg.game = GameCommand.GALACTIC_TRAVELER
        elif game == 'spaceship_tidyup' or game == 't':
            msg.game = GameCommand.SPACESHIP_TIDYUP
        elif game == 'alien_codes' or game == 'a':
            msg.game = GameCommand.ALIEN_CODES

    # Send message.
    pub.publish(msg)
    rospy.loginfo(msg)
    r.sleep()


if __name__ == '__main__':
    try:
        game_command_sender()
    except rospy.ROSInterruptException:
        print('ROSnode shutdown')
