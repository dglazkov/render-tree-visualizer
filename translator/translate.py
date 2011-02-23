import re
from string import Template

class Translator:
    def __init__(self, matchers):
        self.inside_quotes = False
        self.delimiter = None
        self._matchers = matchers
        self.is_first_token = True

    def _new_line(self):
        self.delimiter = None

    def _new_token(self):
        if self.delimiter == None:
            self.delimiter = ''
        elif self.inside_quotes:
            self.delimiter = ' '
        else:
            self.delimiter = '.'

    def _translate_statement(self, text):
        result = []
        self.is_first_token = True
        for token in text.split():
            self._new_token()
            for matcher in self._matchers:
                if matcher.translate(self, token, result):
                    break
            self.is_first_token = False
        return ''.join(result)

    def translate_file(self, f):
        line_pattern = re.compile('^(\s*)(.+)$')
        last_result = None
        for line in f:
            self._new_line()
            (start, indentation, statement, end) = line_pattern.split(line)
            if last_result:
                print last_result.output(indentation)
            last_result = TranslatedLine(indentation, self._translate_statement(statement))
        if last_result:
            print last_result.output('')

class DefaultMatcher():
    def translate(self, context, token, result):
        result.append(context.delimiter + token)
        return True

class QuoteStartMatcher():
    def translate(self, context, token, result):
        if token[0] == '"':
            result.append('.text(' + token)
            if token[-1] == '"':
                result.append(')')
            else:
                context.inside_quotes = True
            return True
        return False

class QuoteEndMatcher():
    def translate(self, context, token, result):
        if token[-1] == '"':
            result.append(' ' + token + ')')
            context.inside_quotes = False
            return True
        return False

class TextRunMatcher():
    def translate(self, context, token, result):
        if token == 'run' and not context.inside_quotes:
            result.append('()')
            return True
        return False

class RegexMatcher():
    def match_and_replace(self, token, result):
        match_object = self.pattern.match(token)
        if match_object:
            result.append(self.template.substitute(match_object.groupdict()))
            return True
        return False

    def translate(self, context, token, result):
        return self.match_and_replace(token, result)

class ParenMatcher(RegexMatcher):
    def __init__(self):
        self.pattern = re.compile('(?P<pos>\([^\d,]+)')
        self.template = Template('.pos$pos')
    def translate(self, context, token, result):
        if token[0] == '(':
            if self.match_and_replace(token, result):
                return True
            result.append(token)
            return True
        return False


class RenderingPrimitiveMatcher(RegexMatcher):
    def __init__(self):
        self.pattern = re.compile('Render(?P<name>\w+)')
        self.template = Template('render("$name")')

    def translate(self, context, token, result):
        if context.is_first_token:
            if self.match_and_replace(token, result):
                return True
            if token == 'layer':
                result.append(token + '()')
            if token == 'text':
                result.append(token)
            return True
        return False

class SizeMatcher(RegexMatcher):
    def __init__(self):
        self.pattern = re.compile('(?P<width>\d+)x(?P<height>\d+)')
        self.template = Template('($width,$height)')

class TextWidthMatcher(RegexMatcher):
    def __init__(self):
        self.pattern = re.compile('(?P<textWidth>\d+):')
        self.template = Template('($textWidth)')

class TagMatcher(RegexMatcher):
    def __init__(self):
        self.pattern = re.compile('{(?P<tag>#?\w+)}$')
        self.template = Template('.tag("$tag")')

class PropertyMatcher(RegexMatcher):
    def __init__(self):
        self.pattern = re.compile('\[(?P<name>#?\w+)=(?P<value>.+)\]$')
        self.template = Template('.property("$name","$value")')

class TranslatedLine():
    def __init__(self, indentation, text):
        self.indentation = indentation
        self.text = text

    def output(self, next_line_indentation):
        brace = None
        next_indentation_len = len(next_line_indentation)
        indentation_delta = (next_indentation_len - len(self.indentation)) / 2
        if indentation_delta > 0:
            brace = '.contains(';
        elif indentation_delta == 0:
            if next_indentation_len == 0:
                brace = ';'
            else:
                brace = ','
        else:
            brace = ''.rjust(-indentation_delta, ')')
            if next_indentation_len == 0:
                brace += ';'
            else:
                brace += ','
        return ''.join([ self.indentation, self.text, brace ])

if __name__ == '__main__':
    f = open('../sample-data/controls-styling-expected.txt')
    translator = Translator([
        RenderingPrimitiveMatcher(),
        ParenMatcher(),
        TextRunMatcher(),
        QuoteStartMatcher(),
        QuoteEndMatcher(),
        SizeMatcher(),
        TextWidthMatcher(),
        TagMatcher(),
        PropertyMatcher(),
        DefaultMatcher()
    ])
    translator.translate_file(f)
