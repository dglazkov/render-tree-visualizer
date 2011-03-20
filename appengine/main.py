from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.api.urlfetch import fetch
from translator import Translator

class TranslatorPage(webapp.RequestHandler):
    def get(self, page):
        self.response.headers['Content-Type'] = 'text/plain'
        response = fetch('http://trac.webkit.org/export/HEAD/trunk/LayoutTests/' + page + '-expected.txt')
        translator = Translator()
        translator.translate_file(self.response.out, response.content.split('\n'))

application = webapp.WSGIApplication(
                                     [('/(.*)', TranslatorPage)],
                                     debug=True)

def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()
