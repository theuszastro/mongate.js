use crate::code::CodeGeneration;
use crate::errors::syntax_error::SyntaxError;
use crate::errors::syntax_error::SyntaxErrorConfig;
use crate::parser::{BodyToken, ParsedToken};
use crate::tokenizer::Token;

#[derive(Debug, Clone)]
pub struct Verifier {
    names: Vec<String>,
    filename: String,

    generation: CodeGeneration,
}

impl Verifier {
    pub fn new(filename: String) -> Self {
        Self {
            filename,
            generation: CodeGeneration::new(),
            names: vec![],
        }
    }

    pub fn end(&mut self) {
        self.generation.generateToFile(self.filename.clone());
    }

    pub fn verify(&mut self, token: ParsedToken) {
        match token.clone() {
            ParsedToken::Expr(expr) => {}
            ParsedToken::Body(body) => match body {
                BodyToken::VariableDeclaration(tokenName, expr)
                | BodyToken::ConstantDeclaration(tokenName, expr) => {
                    if let Token::Identifier(name, ctx) = tokenName {
                        if self.names.contains(&name) {
                            println!("");
                            println!("[Error] Namespace collision {}", name);
                            println!("Line: {}", ctx.lineContent);

                            std::process::exit(1);
                        }

                        self.names.push(name);
                    }
                }

                _ => {}
            },
        }

        self.generation.generate(token);
    }
}
