
import os
import shutil
import signal
import subprocess
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

    return popen(cmd)

def popen_serv(server_type):
    assert server_type in ['web', 'data']

    p = popen(['python', 'serv{t}/serv{t}.py'.format(t=server_type), '--testing'])
    time.sleep(1)
    return p

def pclose(p):
    p.send_signal(signal.SIGINT)
    p.wait()


if __name__ == '__main__':
    db_name = 'test.db'
    web_server_domain = '127.0.0.1'
    web_server_port = 5000
    web_test = 'http://{domain}:{port}/test.html'.format(
        domain=web_server_domain,
        port=web_server_port
    )

    mongod = popen_mongod(db_name)
    servdata = popen_serv('data')
    servweb = popen_serv('web')

    firefox = popen_firefox(DEFAULT_CWD + 'test.firefox-profile', web_test)
    firefox.wait()

    pclose(servweb)
    pclose(servdata)
    pclose(mongod)

    if os.uname()[0] == 'Darwin':
        os.system("kill $(lsof -t -i:{})".format(5000))
