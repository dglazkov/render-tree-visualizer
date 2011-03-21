from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.api.urlfetch import fetch
from translator import Translator

class TranslatorPage(webapp.RequestHandler):
    def get(self, page):
        self.response.headers['Content-Type'] = 'text/html'
        # FIXME: URL stringing is sooo crude.
        response = fetch('http://trac.webkit.org/export/HEAD/trunk/LayoutTests/' + page + '-expected.txt')
        translator = Translator()
        self.response.out.write('<html>\n<head>\n<link rel="stylesheet" type="text/css" href="/assets/styles.css">\n<script src="/assets/visualizer.js"></script>\n<script>')
        translator.translate_file(self.response.out, response.content.split('\n'))
        self.response.out.write('</script>\n</head>\n<body></body>\n</html>\n')

application = webapp.WSGIApplication(
                                     [('/(.*)', TranslatorPage)],
                                     debug=True)

def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()
