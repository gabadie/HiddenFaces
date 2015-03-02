
import argparse
import os
import shutil
import signal
import subprocess
import sys
import time


DEFAULT_CWD=os.path.dirname(os.path.abspath(__file__)) + '/'


def popen(cmd, cwd=DEFAULT_CWD):
    p = subprocess.Popen(cmd, cwd=cwd)

    print '{cwd} ({pid})> {shell}'.format(
        cwd=cwd,
        pid=p.pid,
        shell=subprocess.list2cmdline(cmd)
    )

    return p

def popen_mongod(db_name):
    db_path = DEFAULT_CWD + db_name

    if os.path.isdir(db_path):
        shutil.rmtree(db_path)

    os.makedirs(db_path)

    cmd = ['mongod']
    cmd.extend(['--dbpath', db_path])
    cmd.extend(['--logpath', db_path + '/mongod.log'])

    p = popen(cmd)

    time.sleep(1)

    return p

def popen_firefox(profile, url):
    cmd = ['firefox']
    cmd.extend(['--profile', profile])
    cmd.extend(['--new-tab', url])

    if os.uname()[0] == 'Darwin':
        cmd[0] = '/Applications/Firefox.app/Contents/MacOS/firefox'

    if os.path.isdir(profile):
        shutil.rmtree(profile)

    return popen(cmd)

def popen_serv(server_type, testing_profile=False):
    assert server_type in ['web', 'data']

    cmd = ['python', 'serv{t}/serv{t}.py'.format(t=server_type)]

    if testing_profile:
        cmd.append('--testing')

    p = popen(cmd)
    time.sleep(5)
    return p

def pclose(p):
    p.send_signal(signal.SIGINT)
    p.wait()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Runs the HiddenFaces\' data server.'
    )
    parser.add_argument("--testing",
        help="turns on the testing profile",
        action="store_true",
        dest="testing_profile"
    )
    parser.add_argument("--firefox-test",
        help="launch tests in firefox",
        action="store_true",
        dest="firefox_test"
    )
    args = parser.parse_args(sys.argv[1:])

    db_name = 'test.db'
    web_server_domain = '127.0.0.1'
    web_server_port = 5000
    web_test = 'http://{domain}:{port}/test.html'.format(
        domain=web_server_domain,
        port=web_server_port
    )

    mongod = popen_mongod(db_name)
    servdata = popen_serv('data', testing_profile=args.testing_profile)
    servweb = popen_serv('web', testing_profile=args.testing_profile)

    if args.firefox_test:
        firefox = popen_firefox(DEFAULT_CWD + 'test.firefox-profile', web_test)
        firefox.wait()

    else:
        raw_input("Press enter to stop\n")

    pclose(servweb)
    pclose(servdata)
    pclose(mongod)

    if os.uname()[0] == 'Darwin':
        os.system("kill $(lsof -t -i:{})".format(5000))
