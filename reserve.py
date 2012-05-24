
from __future__ import print_function

import sys
from subprocess import Popen, PIPE

def getDate():
  # valid date 2012-04-30
  return raw_input('What date is this for -- 2012-04-30: ')

def getTime():
  # valid time evening
  return raw_input('When -- morning | afternoon | evening: ')

def getUserId():
  # valid
  return raw_input('SUID number -- number used to create account: ')

def getMachineId():
  # valid 19
  return raw_input('Machine id -- like 19: ')

def getCookie():
  fallback = '55959bb754b45c5ebf8e206219f9828a'
  i = raw_input('PHP session ID -- hex number from cookie ({0}): '.format(fallback))
  return i or fallback

def main():
  print('Enter in the parameters needed')
  print('Just enter nothing to use the default (in brackets)')
  url_referer = 'https://cgi.stanford.edu/group/prl/cgi-bin/webshop/reservations.php'
  url_addreservation = 'https://cgi.stanford.edu/group/prl/cgi-bin/webshop/addReservation.php'
  date = getDate()
  time = getTime()
  userid = getUserId()
  machineid = getMachineId()
  cookie = getCookie()
  args = [
    'curl',
    '-v',
    '--anyauth',
    '-d',
    'date=' + date,
    '-d',
    'time=' + time,
    '-d',
    'userid=' + userid,
    '-d',
    'machineid=' + machineid,
    '-d',
    'type=reservation',
    '-e',
    url_referer,
    '-b',
    'PHPSESSID=' + cookie,
    url_addreservation
  ]
  print ( (' ').join(args) , file=sys.stderr)
  child = Popen(args, stdout=PIPE, stderr=PIPE)
  (out, err) = child.communicate()
  print(out)
  if err:
    print('stderr', err, file=sys.stderr)

if __name__ == '__main__':
  main()
