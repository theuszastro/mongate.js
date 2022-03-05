use crate::code::CodeGeneration;
use crate::parser::Expression;
use crate::parser::{BodyToken, ParsedToken};
use crate::tokenizer::Token;

#[derive(Debug, Clone)]
pub struct Verifier {
    names: Vec<String>,
    filename: String,

    generation: CodeGeneration,
}

impl Verifier {
    fn expression(&self, value: Expression) {
        println!("expr: {:?}", value);

        match value {
            _ => {}
        }
    }

    pub fn verify(&mut self, token: ParsedToken) {
        match token.clone() {
            ParsedToken::Expr(expr) => self.expression(expr),
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

                    self.expression(expr);
                }
            },
        }

        self.generation.generate(token);
    }

    pub fn end(&mut self) {
        self.generation.generateToFile(self.filename.clone());
    }

    pub fn new(filename: String) -> Self {
        Self {
            filename,
            generation: CodeGeneration::new(),
            names: vec![],
        }
    }
}
