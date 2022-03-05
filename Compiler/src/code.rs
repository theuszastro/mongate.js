use crate::parser::{BodyToken, Expression, ParsedToken};

#[derive(Debug, Clone)]
pub struct CodeGeneration {
    code: String,
}

impl CodeGeneration {
    fn expression(&self, value: Expression) -> String {
        match value {
            Expression::Undefined => "undefined".to_string(),
            Expression::Null => "null".to_string(),
            Expression::Number(v) => v.clone(),
            Expression::Identifier(v) => v.clone(),
            Expression::Binary(l, op, r) => {
                format!(
                    "{} {} {}",
                    self.expression(*l),
                    op.tokenValue(),
                    self.expression(*r)
                )
            }
            Expression::ParenBinary(ex) => {
                format!("({})", self.expression(*ex))
            }
            _ => "".to_string(),
        }
    }

    fn variableOrConstant(&mut self, r#type: String, name: String, value: Expression) {
        let code = format!("{} {} = {};\n", r#type, name, self.expression(value));

        self.code.push_str(code.as_str());
    }

    pub fn generateToFile(&mut self, filename: String) {
        if self.code.ends_with("\n") {
            self.code.pop();
        }

        println!("code for '{}': ", filename.replace(".nylock", ".js"));
        println!("{}", self.code);
    }

    pub fn generate(&mut self, token: ParsedToken) {
        match token {
            ParsedToken::Expr(expr) => {
                let code = format!("{}\n", self.expression(expr));

                self.code.push_str(code.as_str());
            }
            ParsedToken::Body(body) => match body {
                BodyToken::VariableDeclaration(token, expr) => {
                    self.variableOrConstant("let".to_string(), token.tokenValue(), expr);
                }

                BodyToken::ConstantDeclaration(token, expr) => {
                    self.variableOrConstant("let".to_string(), token.tokenValue(), expr);
                }

                _ => {}
            },
        }
    }

    pub fn new() -> Self {
        Self {
            code: String::new(),
        }
    }
}
