import re

class Context:
    def __init__(self):
        self.inside_quotes = False
        self.delimiter = None

    def new_line(self):
        self.delimiter = None

    def new_token(self):
        if self.delimiter == None:
            self.delimiter = ''
        elif context.inside_quotes:
            self.delimiter = ' '
        else:
            self.delimiter = '.'

class Matcher:
    def __init__(self, context):
        self.context = context

class ParenMatcher(Matcher):
    def __init__(self, context):
        Matcher.__init__(self, context)

    def matches(self, token):
        if token[0] == '(':
            self.value = token
            return True
        return False

    def translate(self, result):
        if self.value:
            result.append(self.value)

class DefaultMatcher(Matcher):
    def __init__(self, context):
        Matcher.__init__(self, context)

    def matches(self, token):
        self.value = token
        return True

    def translate(self, result):
        if self.value:
            result.append(self.context.delimiter + self.value)

class QuoteStartMatcher(Matcher):
    def __init__(self, context):
        Matcher.__init__(self, context)

    def matches(self, token):
        if token[0] == '"':
            self.value = token
            return True
        return False

    def translate(self, result):
        result.append('.text(' + self.value)
        if self.value[-1] == '"':
            result.append(')')
        else:
            self.context.inside_quotes = True

class QuoteEndMatcher(Matcher):
    def __init__(self, context):
        Matcher.__init__(self, context)

    def matches(self, token):
        if token[-1] == '"':
            self.value = token
            return True
        return False

    def translate(self, result):
        result.append(' ' + self.value + ')')
        self.context.inside_quotes = False

class TextRunMatcher(Matcher):
    def __init__(self, context):
        Matcher.__init__(self, context)

    def matches(self, token):
        if token == 'run':
            self.value = token
            return True
        return False
    def translate(self, result):
        result.append('Run')

class RegexMatcher(Matcher):
    def __init__(self, context):
        Matcher.__init__(self, context)

    def matches(self, token):
        match_object = self.pattern.match(token)
        if match_object:
            self.values = match_object.groupdict()
            return True
        return False

class SizeMatcher(RegexMatcher):
    def __init__(self, context):
        RegexMatcher.__init__(self, context)
        self.pattern = re.compile('(?P<width>\d+)x(?P<height>\d+)')

    def translate(self, result):
        if self.values:
            result.append('(' + self.values['width'] + ',' + self.values['height'] + ')')

class TextWidthMatcher(RegexMatcher):
    def __init__(self, context):
        RegexMatcher.__init__(self, context)
        self.pattern = re.compile('(?P<textWidth>\d+):')

    def translate(self, result):
        if self.values:
            result.append('(' + self.values['textWidth'] + ')')

class TagMatcher(RegexMatcher):
    def __init__(self, context):
        RegexMatcher.__init__(self, context)
        self.pattern = re.compile('{(?P<tag>#?\w+)}$')

    def translate(self, result):
        if self.values:
            result.append('("' + self.values['tag'] + '")')

class PropertyMatcher(RegexMatcher):
    def __init__(self, context):
        RegexMatcher.__init__(self, context)
        self.pattern = re.compile('\[(?P<name>#?\w+)=(?P<value>.+)\]$')

    def translate(self, result):
        if self.values:
            result.append('.property("' + self.values['name'] + '", "' + self.values['value'] + '")')

class TranslatedLine():
    def __init__(self, indentation, text):
        self.indentation = indentation
        self.text = text
        self.braces = None

    def _brace(self, next_line_indentation):
        next_indentation_len = len(next_line_indentation)
        indentation_delta = (next_indentation_len - len(self.indentation)) / 2
        if indentation_delta > 0:
            self.brace = '.contains(';
        elif indentation_delta == 0:
            if next_indentation_len == 0:
                self.brace = ';'
            else:
                self.brace = ','
        else:
            self.brace = ''.rjust(-indentation_delta, ')')
            if next_indentation_len == 0:
                self.brace += ';'
            else:
                self.brace += ','

    def output(self, next_indentation_len):
        self._brace(next_indentation_len)
        return ''.join([ self.indentation, self.text, self.brace ])

def translate_text(context, text):
    result = []
    matchers = [
        ParenMatcher(context),
        TextRunMatcher(context),
        QuoteStartMatcher(context),
        QuoteEndMatcher(context),
        SizeMatcher(context),
        TextWidthMatcher(context),
        TagMatcher(context),
        PropertyMatcher(context),
        DefaultMatcher(context)
    ]
    for token in text.split():
        context.new_token()
        for matcher in matchers:
            if matcher.matches(token):
                matcher.translate(result)
                break
    return ''.join(result)

if __name__ == '__main__':
    f = open('../sample-data/controls-styling-expected.txt')
    context = Context()
    line_pattern = re.compile('^(\s*)(.+)$')
    last_result = None
    for line in f:
        context.new_line()
        (start, indentation, statement, end) = line_pattern.split(line)
        if last_result:
            print last_result.output(indentation)
        last_result = TranslatedLine(indentation, translate_text(context, statement))
    if last_result:
        print last_result.output('')
