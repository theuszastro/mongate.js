use crate::parsers::{Expression, ParsedToken, StatementToken};

#[derive(Debug, Clone)]
pub struct CodeGeneration {
    pub code: String,
}

impl CodeGeneration {
    fn expression(&self, value: Expression) -> String {
        match value {
            Expression::Undefined => "undefined".to_string(),
            Expression::Null => "null".to_string(),
            Expression::Number(v) => v.clone(),
            Expression::Identifier(v) => v.clone(),
            Expression::String(data) => format!("`{}`", data),
            Expression::Boolean(v) => v.to_string(),
            Expression::RegExp(regex, args) => format!("/{}/{}", regex, args),
            Expression::Object(values) => {
                let mut code = String::from("{ ");
                code.push_str(
                    values
                        .iter()
                        .map(|(key, value)| {
                            format!("'{}': {}", key, self.expression(value.clone()))
                        })
                        .collect::<Vec<String>>()
                        .join(", ")
                        .as_str(),
                );

                code = code.trim_end().to_string();
                code.push_str(" }");

                code
            }
            Expression::Array(v) => {
                let mut result = "[".to_string();
                for (i, item) in v.iter().enumerate() {
                    if i > 0 {
                        result.push_str(", ");
                    }

                    result.push_str(&self.expression(item.clone()));
                }
                result.push_str("]");

                result
            }
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
        }
    }

    pub fn generate(&mut self, token: ParsedToken) {
        match token {
            ParsedToken::Expr(expr) => {
                let code = format!("{}\n", self.expression(expr));

                self.code.push_str(code.as_str());
            }
            ParsedToken::Statement(data) => match data {
                StatementToken::VariableDeclaration(name, expr) => {
                    let code = format!("let {} = {}\n", name.tokenValue(), self.expression(expr));

                    self.code.push_str(code.as_str());
                }
                StatementToken::ConstantDeclaration(name, expr) => {
                    let code = format!("const {} = {}\n", name.tokenValue(), self.expression(expr));

                    self.code.push_str(code.as_str());
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
