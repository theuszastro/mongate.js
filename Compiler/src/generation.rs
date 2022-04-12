use std::mem::ManuallyDrop;

use crate::utils::isLibrary;
use crate::utils::{Expression, ParsedToken, ParsedToken::Expr, Pointer, StatementToken, Token};

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

pub fn generate(pointer: &mut ManuallyDrop<Pointer>, token: ParsedToken) {
    match token {
        ParsedToken::Expr(expr) => pointer.code.push_str(&expression(expr)),
        ParsedToken::Statement(data) => match data {
            StatementToken::ExportDeclaration(default, value) => {
                if !pointer.isNode {
                    pointer.code.push_str("export ");

                    if default.is_some() {
                        pointer.code.push_str("default ");
                    }
                }

                generate(pointer, *value);
            }
            StatementToken::ImportDeclaration(default, names, from) => {
                if pointer.isNode && !isLibrary(from.clone()) {
                    return;
                }

                if pointer.es6 {
                    pointer.code.push_str("import ");

                    if let Some(defaultName) = default {
                        pointer.code.push_str(&format!(
                            "{}{}",
                            defaultName,
                            if names.len() >= 1 { ", " } else { " " }
                        ));
                    }
                } else {
                    pointer.code.push_str("const { ");

                    if let Some(defaultName) = default {
                        pointer.code.push_str(&format!("default: {} ", defaultName));
                    }

                    if names.len() < 1 {
                        pointer.code.push_str("} ");
                    }
                }

                if names.len() >= 1 {
                    pointer.code.push_str("{ ");

                    for importedName in names.iter() {
                        if let Token::Identifier(name, ..) = importedName {
                            pointer.code.push_str(&format!("{}, ", name));
                        }
                    }

                    if pointer.code.ends_with(", ") {
                        pointer.code.pop();
                        pointer.code.pop();
                    }

                    pointer.code.push_str(" } ");
                }

                if pointer.es6 {
                    pointer.code.push_str(&format!("from '{}';", from));
                } else {
                    pointer.code.push_str(&format!("= require('{}');", from));
                }
            }
            StatementToken::ReturnDeclaration(expr) => {
                pointer
                    .code
                    .push_str(&format!("return {}", expression(expr)));
            }
            StatementToken::VariableDeclaration(name, expr) => {
                pointer
                    .code
                    .push_str(&format!("let {} = {};", name, expression(expr)));
            }
            StatementToken::ConstantDeclaration(name, expr) => {
                pointer
                    .code
                    .push_str(&format!("const {} = {};", name, expression(expr)));
            }
            StatementToken::FunctionDeclaration(name, args, body, isAsync) => {
                generate_function(pointer, name, args, body, isAsync);
            }
            StatementToken::IfDeclaration(condition, body, elseBody) => {
                pointer.code.push_str("if(");

                pointer.code.push_str(&expression(condition));
                pointer.code.push_str(") {");

                generateBody(pointer, body);

                if elseBody.len() >= 1 {
                    pointer.code.push_str(" else {");

                    generateBody(pointer, elseBody);
                }
            }
            _ => {}
        },
    }
}

fn generateBody(pointer: &mut ManuallyDrop<Pointer>, body: Vec<ParsedToken>) {
    if body.len() < 1 {
        pointer.code.push_str("}");

        return;
    }

    for item in body {
        if let Expr(Expression::FunctionArg(..)) = item {
            continue;
        }

        generate(pointer, item);
    }

    pointer.code.push_str("}");
}

fn generate_function(
    pointer: &mut ManuallyDrop<Pointer>,
    name: String,
    args: Vec<Expression>,
    body: Vec<ParsedToken>,
    isAsync: bool,
) {
    pointer.code.push_str(if isAsync { "async " } else { "" });

    pointer.code.push_str(&format!("function {}(", name));
    args.iter()
        .map(|x| expression(x.clone()))
        .for_each(|x| pointer.code.push_str(&x));

    if pointer.code.ends_with(", ") {
        pointer.code.pop();
        pointer.code.pop();
    }
    pointer.code.push_str(") {");

    generateBody(pointer, body);
}
