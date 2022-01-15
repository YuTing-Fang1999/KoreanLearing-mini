from flask import Flask, render_template, request, redirect,\
    url_for, redirect

from crawl_data import *
import sqlite3
import requests as rq
from langconv import Converter


dbfile = "vlive.db"

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0


@app.route("/", methods=['GET', 'POST'])
def index():
    return redirect(url_for('home'))


@app.route("/home", methods=['GET', 'POST'])
def home():
    return render_template('home.html')


@app.route("/video/<V_id>", methods=['GET', 'POST'])
def video(V_id):
    # url='https://www.vlive.tv/video/'+V_id
    data = connect_video(V_id,
                         video_P=["720P"],
                         vtt_language=["ko_KR", "zh_TW", "en_US"])

    data['video_url'] = data["720P"]
    data['crossorigin'] = 1

    with sqlite3.connect("vlive.db") as conn:
        cur = conn.cursor()
        exist = cur.execute("SELECT EXISTS (SELECT 1 \
                           FROM video_list \
                           WHERE id=?\
                           LIMIT 1)""", (V_id, )).fetchone()[0]
        if exist == 0:
            data['favorite'] = 0
        else:
            data['favorite'] = 1
    # print(data)
    return render_template("video.html", data=data)


@app.route("/load_video_list", methods=['GET', 'POST'])
def load_video_list():
    with sqlite3.connect('vlive.db') as conn:
        cur = conn.execute('select * from video_list\
                           WHERE NOT id=\'conn_online\';')
        return {"video_list": cur.fetchall()}


@app.route("/add_to_my_video", methods=['GET', 'POST'])
def download_data():
    V_id = request.form.get('V_id')
    subject = request.form.get('subject')
    img_url = request.form.get('img_url')

    conn = sqlite3.connect("vlive.db")
    cur = conn.cursor()

    exist = cur.execute("SELECT EXISTS (SELECT 1 \
                     FROM video_list \
                     WHERE id=?\
                     LIMIT 1)""", ('youtu/'+V_id, )).fetchone()[0]
    if exist == 0:
        print("插入新row")
        cur.execute('insert into video_list(id, subject, img_url)\
                           values(?,?,?)', [V_id, subject, img_url])
    conn.commit()
    conn.close()

    return "ok"


@app.route('/delete_my_video', methods=['GET', 'POST'])
def delete_video_block():
    V_id = request.form.get('V_id')
    print(V_id)
    with sqlite3.connect(dbfile) as conn:
        conn.execute('delete from video_list where id=?', (V_id,))
        # if os.path.exists("static/download/"+V_id):
        #     shutil.rmtree("static/download/"+V_id)
    return "ok"


@app.route("/search/all", methods=['GET', 'POST'])
def search_all():
    query = request.args.get('query')
    if 'https://www.youtube.com/watch' in query:
        spi = query.split('?')[1].split('&')[0].split('=')[1]
        return redirect(url_for('youtuVideo', V_id=spi))

    if 'https://www.vlive.tv/video' in query:
        # reg = r'https://www.vlive.tv/video/(.*?)\?'
        # spi = re.findall(reg, query)[0]
        spi = query.split('/')[4]
        return redirect(url_for('video', V_id=spi))

    data = get_vlive_search_all(query)
    return render_template("search_all.html", data=json.dumps(data))


@app.route("/search/more_videos", methods=['GET', 'POST'])
def get_vlive_web_more_videos():
    data = more_videos(request.form.get('pageNo'),
                       request.form.get('sOffset'),
                       request.form.get('query'))
    return data


@app.route("/channel/<ch_code>", methods=['GET', 'POST'])
def channels(ch_code):
    data = get_vlive_channel(ch_code)
    return render_template("channel.html", data=data)


@app.route("/channel/more", methods=['GET', 'POST'])
def get_vlive_web_more_channels():
    data = more_channels(request.form.get('after'),
                         request.form.get('ch_code'))
    return data


@app.route('/naver_api', methods=['GET', 'POST'])
def call_naver_api():
    query = request.form.get('query')
    print(query)
    data = Converter('zh-hant').convert(get_naver(query))
    return data


if __name__ == "__main__":
    app.run(debug=True,
            # host='0.0.0.0',
            # port=10914,
            )

    app.jinja_env.auto_reload = True
