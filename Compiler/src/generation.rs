use crate::parsers::{Expression, ParsedToken, StatementToken};

fn expression(value: Expression) -> String {
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
                    .map(|(key, value)| format!("'{}': {}", key, expression(value.clone())))
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

                result.push_str(&expression(item.clone()));
            }
            result.push_str("]");

            result
        }
        Expression::Binary(l, op, r) => {
            format!("{} {} {}", expression(*l), op.tokenValue(), expression(*r))
        }
        Expression::ParenBinary(ex) => {
            format!("({})", expression(*ex))
        }
    }
}

pub fn generate(token: ParsedToken, allCode: &mut String) {
    match token {
        ParsedToken::Expr(expr) => allCode.push_str(&expression(expr)),
        ParsedToken::Statement(data) => match data {
            StatementToken::VariableDeclaration(name, expr) => {
                allCode.push_str(&format!(
                    "let {} = {};\n",
                    name.tokenValue(),
                    expression(expr)
                ));
            }
            StatementToken::ConstantDeclaration(name, expr) => {
                allCode.push_str(&format!(
                    "const {} = {};\n",
                    name.tokenValue(),
                    expression(expr)
                ));
            }
        },
    }
}
