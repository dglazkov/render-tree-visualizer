from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
import translator

class TranslatorPage(webapp.RequestHandler):
    def get(self, page):
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write(page)

application = webapp.WSGIApplication(
                                     [('/(.*)', TranslatorPage)],
                                     debug=True)

def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()
