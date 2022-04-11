use diacritics::remove_diacritics;
use regex::Regex;

use crate::utils::{Token, TokenContext};

#[derive(Debug, Clone)]
pub struct Tokenizer {
    pub filename: String,
    pub content: String,
    pub lines: Vec<Vec<String>>,
    pub line: usize,

    cursor: usize,
    letter: String,
    keywords: Vec<String>,
}

impl Tokenizer {
    fn getLine(&self) -> String {
        let line = self.lines.get(self.line - 1);

        if let Some(currentLine) = line {
            return currentLine.join("");
        }

        "".to_string()
    }

    fn isLetter(&self) -> bool {
        let regex = Regex::new("[a-zA-Z0-9_]").unwrap();
        let letter = self.letter.as_str();

        regex.is_match(remove_diacritics(letter).as_str())
    }

    fn changeLetter(&mut self) {
        let line = self.lines.get(self.line - 1);

        if let Some(currentLine) = line {
            let letters = currentLine.iter().nth(self.cursor);

            if let Some(content) = letters {
                self.letter = content.to_string();

                return;
            }
        }

        self.letter = "EndFile".to_string();
    }

    pub fn memorize(&self) -> (String, usize, usize) {
        return (self.letter.clone(), self.line, self.cursor);
    }

    pub fn restore(&mut self, data: (String, usize, usize)) {
        self.letter = data.0;
        self.line = data.1;
        self.cursor = data.2;
    }

    pub fn context(&self) -> TokenContext {
        TokenContext {
            filename: self.filename.clone(),
            line: self.line as i64,
            lineContent: self.getLine(),
        }
    }

    pub fn previewNextToken(&mut self, skipNewline: bool, skipWhitespace: bool) -> Option<Token> {
        let line = self.line;
        let letter = self.letter.clone();
        let cursor = self.cursor;

        let mut token = self.getToken();

        loop {
            match token {
                Some(Token::Whitespace(_)) if skipWhitespace => {
                    token = self.getToken();
                }
                Some(Token::Newline(_)) if skipNewline => {
                    token = self.getToken();
                }
                _ => break,
            }
        }

        self.line = line;
        self.cursor = cursor;
        self.letter = letter;

        return token;
    }

    pub fn next(&mut self) {
        self.cursor += 1;

        self.changeLetter();
    }

    pub fn newline(&mut self) {
        self.cursor = 0;
        self.line += 1;

        self.changeLetter();
    }

    pub fn getToken(&mut self) -> Option<Token> {
        let mut _token: Option<Token> = None;

        let letter = self.letter.clone();
        let context = self.context();

        match letter.as_str() {
            "EndFile" => _token = Some(Token::EOF),
            "(" | ")" | "[" | "]" | "{" | "}" => _token = Some(Token::Brackets(letter, context)),
            "+" | "-" | "/" | "*" | "%" => _token = Some(Token::Operator(letter, context)),
            "&" | "|" => _token = Some(Token::LogicalOperator(letter, context)),
            "@" | "$" | "^" | "\\" | "#" | "'" | "\"" => {
                _token = Some(Token::Symbol(letter, context))
            }
            " " => _token = Some(Token::Whitespace(context)),
            "\n" => {
                self.newline();

                return Some(Token::Newline(self.context()));
            }
            "=" | "!" | ">" | "<" | "?" | ":" | "." | "," | ";" => {
                _token = Some(Token::Punctuation(letter, context))
            }
            "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" => {
                _token = Some(Token::Number(letter, context))
            }
            _ => {
                let mut word = String::new();

                loop {
                    match self.letter.as_str() {
                        "EndFile" => break,
                        " " => break,
                        "\n" => break,
                        _ => {
                            if self.isLetter() {
                                word.push_str(&self.letter);
                            } else {
                                break;
                            }
                        }
                    }

                    self.next();
                }

                if self.keywords.contains(&word) {
                    return Some(Token::Keyword(word, self.context()));
                }

                match word.clone().as_str() {
                    "null" => _token = Some(Token::Null(context)),
                    "undefined" => _token = Some(Token::Undefined(context)),
                    _ => _token = Some(Token::Identifier(word, self.context())),
                }

                return _token;
            }
        }

        self.next();

        return _token;
    }

    pub fn new(filename: String, content: String) -> Self {
        let mut lines = content
            .split("\n")
            .map(|x| x.to_string())
            .map(|x| x.split("").map(|y| y.to_string()).collect::<Vec<String>>())
            .map(|mut l| {
                l.pop();
                l.remove(0);

                l.push("\n".to_string());

                return l;
            })
            .collect::<Vec<_>>();

        let len = lines.len();
        lines[(len - 1 as usize)].pop();

        if lines.len() <= 1 {
            if lines[len - 1 as usize].len() == 0 {
                std::process::exit(1);
            }
        }

        Self {
            filename,
            lines: lines.clone(),
            content,
            cursor: 0,
            line: 1,
            letter: lines[0 as usize].iter().nth(0).unwrap().to_string(),
            keywords: Vec::from([
                "let", "const", "async", "fn", "return", "if", "else", "import", "from", "export",
                "default",
            ])
            .iter()
            .map(|data| data.to_string())
            .collect(),
        }
    }
}
