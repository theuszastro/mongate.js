use diacritics::remove_diacritics;
use regex::Regex;

use crate::utils::pointer::Pointer;

#[derive(Debug, Clone)]
pub struct TokenContext {
    pub filename: String,
    pub line: i64,
    pub lineContent: String,
}

#[derive(Debug)]
pub enum Token {
    Identifier(String, TokenContext),
    Number(String, TokenContext),
    Null(TokenContext),
    Undefined(TokenContext),
    Whitespace(TokenContext),
    Newline(TokenContext),
    LogicalOperator(String, TokenContext),
    Operator(String, TokenContext),
    Keyword(String, TokenContext),
    Punctuation(String, TokenContext),
    Brackets(String, TokenContext),
    EOF,
}

pub struct Tokenizer {
    pub filename: String,
    pub content: String,
    pub json: bool,
    pub pointer: Pointer,

    keywords: Vec<String>,
}

impl Tokenizer {
    fn isLetter(&self) -> bool {
        let regex = Regex::new("[a-zA-Z]").unwrap();
        let letter = self.pointer.letter.as_str();

        match letter {
            "_" => true,
            _ => regex.is_match(remove_diacritics(letter).as_str()),
        }
    }

    fn getToken(&mut self) -> Option<Token> {
        let letter = self.pointer.letter.clone();

        let mut _token: Option<Token> = None;

        let context = self.pointer.context();

        match letter.as_str() {
            "EndFile" => _token = Some(Token::EOF),
            "(" | ")" | "[" | "]" | "{" | "}" => _token = Some(Token::Brackets(letter, context)),
            "+" | "-" | "/" | "*" | "%" => _token = Some(Token::Operator(letter, context)),
            "&" | "|" => _token = Some(Token::LogicalOperator(letter, context)),
            "null" => _token = Some(Token::Null(context)),
            "undefined" => _token = Some(Token::Undefined(context)),
            " " => _token = Some(Token::Whitespace(context)),
            "=" | "!" | ">" | "<" | "?" | ":" | "." | "," | ";" => {
                _token = Some(Token::Punctuation(letter, context))
            }
            "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" => {
                _token = Some(Token::Number(letter, context))
            }
            "\n" => {
                self.pointer.next();
                self.pointer.newline();

                return Some(Token::Newline(self.pointer.context()));
            }
            _ => {
                let mut word = String::new();

                loop {
                    match self.pointer.letter.as_str() {
                        "EndFile" => break,
                        " " => break,
                        "\n" => break,
                        _ => {
                            if self.isLetter() {
                                word.push_str(&self.pointer.letter);
                            } else {
                                break;
                            }
                        }
                    }

                    self.pointer.next();
                }

                if self.keywords.contains(&word) {
                    return Some(Token::Keyword(word, self.pointer.context()));
                }

                return Some(Token::Identifier(word, self.pointer.context()));
            }
        }

        self.pointer.next();

        return _token;
    }

    pub fn new(filename: String, content: String, json: bool, pointer: Pointer) -> Self {
        Self {
            filename,
            content,
            json,
            pointer,
            keywords: Vec::from([
                "let", "const", "if", "else", "loop", "for", "class", "extends", "return", "break",
                "continue", "require", "export",
            ])
            .iter()
            .map(|data| data.to_string())
            .collect(),
        }
    }

    pub fn run(&mut self) -> Vec<Token> {
        let mut tokens: Vec<Token> = vec![];

        loop {
            let token = self.getToken();

            match token {
                Some(Token::EOF) => break,
                None => break,
                Some(Token::Identifier(data, _)) if data.len() <= 0 => {
                    break;
                }
                _ => {}
            }

            tokens.push(token.unwrap());
        }

        return tokens;
    }
}
