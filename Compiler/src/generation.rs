use crate::utils::{Expression, ParsedToken, StatementToken};

fn expression(value: Expression) -> String {
    match value {
        Expression::Undefined => "undefined".to_string(),
        Expression::Null => "null".to_string(),
        Expression::Number(v) => v.clone(),
        Expression::Identifier(v) => v.clone(),
        Expression::String(data) => format!("'{}'", data),
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
        Expression::Binary(left, op, right) | Expression::Logical(left, op, right) => {
            format!("{} {} {}", expression(*left), op, expression(*right))
        }
        Expression::ParenBinary(ex) => {
            format!("({})", expression(*ex))
        }
        Expression::FunctionArg(name, value) => {
            if let Some(value) = value {
                return format!("{} = {}, ", name, expression(*value));
            }

            format!("{}, ", name)
        }
        Expression::FunctionCall(name, args) => {
            let mut code = format!("{}(", name);

            for item in args {
                let result = expression(item.clone());

                code.push_str(&result);
                code.push_str(", ");
            }

            if code.ends_with(", ") {
                code.pop();
                code.pop();
            }

            code.push_str(")");

            code
        }
    }
}

pub fn generate(token: ParsedToken, allCode: &mut String) {
    match token {
        ParsedToken::Expr(expr) => allCode.push_str(&expression(expr)),
        ParsedToken::Statement(data) => match data {
            StatementToken::VariableDeclaration(name, expr) => {
                allCode.push_str(&format!("let {} = {};", name, expression(expr)));
            }
            StatementToken::ConstantDeclaration(name, expr) => {
                allCode.push_str(&format!("const {} = {};", name, expression(expr)));
            }
            StatementToken::FunctionDeclaration(name, args, body, isAsync) => {
                allCode.push_str(&generate_function(name, args, body, isAsync));
            }
            StatementToken::IfDeclaration(condition, body, elseBody) => {
                let mut code = String::from("if(");

                code.push_str(&expression(condition));
                code.push_str(") {\n");

                generateBody(body, &mut code);

                if elseBody.len() >= 1 {
                    code.push_str(" else {\n");

                    generateBody(elseBody, &mut code);
                }

                allCode.push_str(&code);
            }
            _ => {}
        },
    }
}

fn generateBody(body: Vec<ParsedToken>, allCode: &mut String) {
    for item in body {
        generate(item, allCode);

        allCode.push_str("\n");
    }

    if allCode.ends_with("\n") {
        allCode.pop();
    }

    allCode.push_str("}");
}

fn generate_function(
    name: String,
    args: Vec<Expression>,
    body: Vec<ParsedToken>,
    isAsync: bool,
) -> String {
    let mut code = String::from(if isAsync { "async " } else { "" });

    code.push_str(&format!("function {}(", name));
    args.iter()
        .map(|x| expression(x.clone()))
        .for_each(|x| code.push_str(&x));

    if code.ends_with(", ") {
        code.pop();
        code.pop();
    }

    code.push_str(") {\n");

    generateBody(body, &mut code);

    code
}
