use crate::errors::syntax_error::SyntaxError;
use crate::errors::syntax_error::SyntaxErrorConfig;
use crate::tokenizer::Token;
use crate::tokenizer::Tokenizer;
use crate::verifier::Verifier;

#[derive(Debug, Clone)]
pub enum Expression {
    Number(String),
    Identifier(String),
    String(String),
    Boolean(String),
    RegExp(String, String),
    Array(Vec<Expression>),
    Object(Vec<(String, Expression)>),
    ParenBinary(Box<Expression>),
    Binary(Box<Expression>, Token, Box<Expression>),
    Null,
    Undefined,
}

#[derive(Debug, Clone)]
pub enum BodyToken {
    VariableDeclaration(Token, Expression),
    ConstantDeclaration(Token, Expression),
}

#[derive(Debug, Clone)]
pub enum ParsedToken {
    Expr(Expression),
    Body(BodyToken),
}

#[derive(Debug, Clone)]
pub struct Parser {
    tokenizer: Tokenizer,
    verifier: Verifier,

    token: Option<Token>,
}

impl Parser {
    fn next(
        &mut self,
        skipNewline: bool,
        skipSemicolon: bool,
        skipWhitespace: bool,
    ) -> Option<Token> {
        match self.tokenizer.getToken() {
            None | Some(Token::EOF) => {
                self.token = None;

                None
            }
            Some(Token::Newline(_)) if skipNewline => {
                return self.next(skipNewline, skipSemicolon, skipWhitespace)
            }
            Some(Token::Whitespace(_)) if skipWhitespace => {
                return self.next(skipNewline, skipSemicolon, skipWhitespace)
            }
            Some(Token::Punctuation(data, _)) if data == ";" && skipNewline => {
                return self.next(skipNewline, skipSemicolon, skipWhitespace)
            }
            Some(Token::Identifier(data, _)) if data.len() <= 0 => None,
            data => {
                self.token = data.clone();

                return data;
            }
        }
    }

    fn previewNext(&mut self) -> Option<Token> {
        let token = self.tokenizer.previewNextToken();

        return token;
    }

    fn take(
        &mut self,
        r#type: &str,
        skipNewline: bool,
        skipSemicolon: bool,
        skipWhitespace: bool,
    ) -> Option<Token> {
        if let Some(token) = self.token.clone() {
            if token.tokenType() == r#type.to_string() {
                self.next(skipNewline, skipSemicolon, skipWhitespace);

                return Some(token);
            }
        }

        None
    }

    fn error(&self, reason: String) {
        SyntaxError::new(SyntaxErrorConfig::new(
            self.tokenizer.filename.clone(),
            self.tokenizer.lines.clone(),
            self.tokenizer.line,
            reason,
        ));
    }

    fn expression(&mut self) -> Option<Expression> {
        match self.token.clone() {
            Some(Token::Undefined(_)) => {
                self.take("Undefined", true, true, true);

                Some(Expression::Undefined)
            }
            Some(Token::Null(_)) => {
                self.take("Null", true, true, true);

                Some(Expression::Null)
            }
            Some(Token::Operator(op, _)) if op == "/" => {
                let next = self.previewNext();
                if next.is_none() || next.unwrap().tokenValue() == "/" {
                    return None;
                }

                let allowedFlags = ["g", "i", "m", "y", "u"];

                let mut regex = String::new();
                let mut regexFlags = String::new();

                self.take("Operator", false, false, false);

                loop {
                    match self.token.clone() {
                        None => break,
                        Some(Token::Operator(op, _)) => {
                            if op == "/" {
                                break;
                            }

                            regex.push_str(op.as_str());
                        }
                        data => {
                            regex.push_str(data.unwrap().tokenValue().as_str());
                        }
                    }

                    self.next(false, false, false);
                }

                let close = self.take("Operator", true, true, false);
                if close.is_none() {
                    self.error("Expected closing '/'".to_string());
                }

                match self.token.clone() {
                    Some(Token::Identifier(data, _)) => {
                        let mut flags: Vec<&str> = vec![];

                        for flag in data.split("").filter(|x| x.len() >= 1) {
                            if !allowedFlags.contains(&flag) {
                                self.error(format!("Invalid flag '{}'", flag));
                            }
                            if flags.contains(&flag) {
                                self.error(format!("This flag already exists '{}'", flag));
                            }
                            flags.push(flag);
                        }

                        self.take("Identifier", true, true, true);

                        regexFlags.push_str(flags.join("").as_str());
                    }
                    Some(Token::Whitespace(_)) => {
                        self.next(true, true, true);

                        if let Some(Token::Identifier(data, _)) = self.token.clone() {
                            self.error(format!("Unexpected Idenfier '{}'", data));
                        }
                    }
                    _ => {}
                }

                Some(Expression::RegExp(regex, regexFlags))
            }
            Some(Token::Brackets(bra, _)) => match bra.as_str() {
                "[" => {
                    self.take("Brackets", true, true, true);

                    let mut values: Vec<Expression> = vec![];

                    loop {
                        match self.token.clone() {
                            Some(Token::Brackets(bra, _)) if bra == "[" => break,
                            _ => {
                                let expr = self.expression();
                                if expr.is_none() {
                                    match self.token.clone() {
                                        Some(Token::Brackets(bra, _)) if bra == "]" => break,
                                        Some(Token::Punctuation(pun, _)) if pun == "," => {
                                            self.take("Punctuation", true, true, true);

                                            values.push(Expression::Undefined);

                                            continue;
                                        }
                                        _ => {}
                                    }

                                    break;
                                }

                                values.push(expr.clone().unwrap());

                                match self.token.clone() {
                                    Some(Token::Punctuation(pun, _)) => {
                                        if pun == "," {
                                            self.next(true, true, true);

                                            continue;
                                        }

                                        break;
                                    }
                                    _ => {
                                        let expr = self.expression();

                                        if expr.is_some() {
                                            self.error("Expected ','".to_string());
                                        }
                                    }
                                }
                            }
                        }
                    }

                    let close = self.take("Brackets", true, true, true);
                    if close.is_none() || close.unwrap().tokenValue() != "]" {
                        self.error("Expected ']'".to_string());
                    }

                    Some(Expression::Array(values))
                }
                "(" => {
                    self.take("Brackets", true, true, true);
                    let expr = self.expression();
                    if let Some(expr) = expr {
                        let close = self.take("Brackets", true, true, true);
                        if close.is_none() {
                            self.error("Expected ')'".to_string());
                        }
                        return Some(Expression::ParenBinary(Box::new(expr)));
                    }
                    None
                }
                "{" => {
                    self.take("Brackets", true, true, true);

                    let mut values: Vec<(String, Expression)> = vec![];

                    loop {
                        match self.token.clone() {
                            Some(Token::Brackets(bra, _)) if bra == "}" => break,
                            _ => {
                                let mut key = String::new();

                                let identifer = self.take("Identifier", true, true, true);
                                if identifer.is_none() {
                                    let keyString = self.expression();
                                    if keyString.is_none() {
                                        self.error("Expected Identifier".to_string());
                                    }

                                    if let Some(Expression::String(value)) = keyString {
                                        key = value;
                                    } else {
                                        self.error("Expected 'String'".to_string());
                                    }
                                } else {
                                    key = identifer.unwrap().tokenValue();
                                }

                                let colon = self.take("Punctuation", true, true, true);
                                if colon.is_none() || colon.unwrap().tokenValue() != ":" {
                                    self.error("Expected ':'".to_string());
                                }

                                let value = self.expression();
                                if value.is_none() {
                                    self.error("Expected Expression".to_string());
                                }

                                values.push((key, value.unwrap()));

                                match self.token.clone() {
                                    Some(Token::Punctuation(pun, _)) => {
                                        if pun == "," {
                                            self.next(true, true, true);

                                            continue;
                                        }

                                        break;
                                    }
                                    _ => {
                                        let expr = self.expression();

                                        if expr.is_some() {
                                            self.error("Expected ','".to_string());
                                        }
                                    }
                                }
                            }
                        }
                    }

                    let close = self.take("Brackets", true, true, true);
                    if close.is_none() || close.unwrap().tokenValue() != "}" {
                        self.error("Expected '}'".to_string());
                    }

                    Some(Expression::Object(values))
                }
                _ => None,
            },
            Some(Token::Identifier(data, _)) => {
                if ["true", "false"].contains(&data.as_str()) {
                    self.take("Identifier", true, true, true);

                    return Some(Expression::Boolean(data));
                }

                Some(Expression::Identifier(data))
            }
            Some(Token::Symbol(sym, _)) if ["'", "\""].contains(&sym.as_str()) => {
                self.take("Symbol", false, false, false);

                let mut string = String::new();

                loop {
                    match self.token.clone() {
                        Some(Token::Symbol(symbol, _))
                            if ["'", "\""].contains(&symbol.as_str()) =>
                        {
                            if string.ends_with("\\") {
                                string.push_str(symbol.as_str());

                                self.take("Symbol", false, false, false);

                                continue;
                            }

                            break;
                        }
                        Some(Token::Newline(_)) => break,
                        Some(data) => {
                            string.push_str(data.tokenValue().as_str());

                            self.next(false, false, false);
                        }
                        None => break,
                    }
                }

                let close = self.take("Symbol", true, true, true);
                if close.is_none() || close.clone().unwrap().tokenValue() != sym {
                    self.error(format!("Expected '{}'", sym));
                }

                Some(Expression::String(string))
            }
            Some(Token::Number(data, _)) => {
                let mut number = data.clone();
                let allowedTypes = ["Number", "Identifier"];

                let next = self.previewNext();

                self.take("Number", true, true, true);

                if next.is_some() && allowedTypes.contains(&next.unwrap().tokenType().as_str()) {
                    if let Some(token) = self.token.clone() {
                        if allowedTypes.contains(&token.tokenType().as_str()) {
                            loop {
                                match self.token.clone() {
                                    Some(Token::Identifier(data, _)) => {
                                        for letter in data.split("").filter(|x| x.len() >= 1) {
                                            match letter {
                                                "e" | "0" | "1" | "2" | "3" | "4" | "5" | "6"
                                                | "7" | "8" | "9" => number.push_str(&letter),
                                                _ => self.error(format!("Unexpected '{}'", letter)),
                                            }
                                        }
                                    }
                                    Some(Token::Number(data, _)) => number.push_str(&data),
                                    _ => break,
                                };
                                let next = self.previewNext();
                                self.take(
                                    self.token.clone().unwrap().tokenType().as_str(),
                                    true,
                                    true,
                                    true,
                                );
                                if next.is_none()
                                    || !allowedTypes.contains(&next.unwrap().tokenType().as_str())
                                {
                                    break;
                                }
                            }
                        }
                    }
                }

                if number.ends_with("e") {
                    self.error(format!("Unexpected 'e'"));
                }

                if number.ends_with(".") {
                    number.pop();
                }

                let preview = self.previewNext();
                if preview.is_some() && preview.unwrap().tokenValue() == "/" {
                    if self.token.clone().unwrap().tokenValue() == "/" {
                        return Some(Expression::Number(number));
                    }
                }

                let op = self.take("Operator", true, true, true);
                if op.is_some() {
                    let right = self.expression();
                    if right.is_none() {
                        self.error("Expected a right value".to_string());
                    }

                    return Some(Expression::Binary(
                        Box::new(Expression::Number(number)),
                        op.unwrap(),
                        Box::new(right.unwrap()),
                    ));
                }

                Some(Expression::Number(number))
            }
            _ => None,
        }
    }

    pub fn run(&mut self) {
        let mut parsedToken: Option<ParsedToken> = None;

        if self.token.is_none() {
            self.next(true, true, true);
        }

        loop {
            if let Some(parsed) = parsedToken.clone() {
                self.verifier.verify(parsed);

                parsedToken = None;
            }

            match self.token.clone() {
                None => break,
                Some(Token::Keyword(data, _)) => match data.as_str() {
                    "let" | "const" => {
                        self.take("Keyword", true, true, true);

                        let name = self.take("Identifier", true, true, true);
                        if name.is_none() {
                            self.error("Expected a Identifier".to_string());
                        }

                        let assign = self.take("Punctuation", true, true, true);
                        if assign.is_none() || assign.clone().unwrap().tokenValue() != "=" {
                            if data == "const" {
                                println!("{:?}", assign);

                                self.error("Expected a '='".to_string());
                            }

                            parsedToken = Some(ParsedToken::Body(BodyToken::VariableDeclaration(
                                name.clone().unwrap(),
                                Expression::Undefined,
                            )));

                            continue;
                        }

                        let value = self.expression();

                        if let Some(expr) = value {
                            if data == "const" {
                                parsedToken = Some(ParsedToken::Body(
                                    BodyToken::ConstantDeclaration(name.unwrap(), expr),
                                ));
                            } else {
                                parsedToken = Some(ParsedToken::Body(
                                    BodyToken::VariableDeclaration(name.unwrap(), expr),
                                ));
                            }

                            continue;
                        }

                        self.error("Expected a value".to_string());
                    }
                    _ => {}
                },
                _ => {
                    let expression = self.expression();

                    if let Some(expr) = expression {
                        parsedToken = Some(ParsedToken::Expr(expr));
                    } else {
                        if self.token.is_some() {
                            self.error(format!(
                                "Unexpected '{}'",
                                self.token.clone().unwrap().tokenValue()
                            ));
                        }
                    }
                }
            }
        }

        self.verifier.end();
    }

    pub fn new(tokenizer: Tokenizer) -> Self {
        Self {
            verifier: Verifier::new(tokenizer.filename.clone()),
            token: None,
            tokenizer,
        }
    }
}
