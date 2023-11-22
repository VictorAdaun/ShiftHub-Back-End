import exp from "constants";
import express, { NextFunction, Request, Response } from "express";
import {
  ExpressMiddlewareInterface,
  Middleware,
  Req,
} from "routing-controllers";
import { Service } from "typedi";

@Middleware({ type: "before", priority: 99 })
@Service()
export class RequestMiddleware implements ExpressMiddlewareInterface {
  use(req: Request, res: Response, next: NextFunction): void {
    if (req.method === "POST") {
      if (req.body.length) {
        req.body = req.body.map((body: any) => {
          return touchArray(body);
        });
        // for (let index = 0; index < req.body.length; index++) {
        //   req.body[index] = touchArray(req.body[index])
        // }
      } else {
        req = touchObject(req);
      }
    }
    next();
  }
}

function touchArray(body: any) {
  if (body.email) {
    body.email = body.email.toLowerCase();
  }
  if (body.firstName) {
    body.firstName = wordChangeTitleCase(body.firstName);
  }
  if (body.lastName) {
    body.lastName = wordChangeTitleCase(body.lastName);
  }
  if (body.fullName) {
    body.fullName = wordChangeTitleCase(body.fullName);
  }
  if (body.userName) {
    body.userName = wordChangeTitleCase(body.userName);
  }
  if (body.title) {
    body.title = wordChangeSentenceCase(body.title);
  }
  if (body.description) {
    body.description = wordChangeSentenceCase(body.description);
  }
  if (body.dueDate) {
    body.dueDate = new Date(body.dueDate);
  }
  if (body.startDate) {
    body.startDate = new Date(body.startDate);
  }
  if (body.endDate) {
    body.endDate = new Date(body.endDate);
  }
  return body;
}

function touchObject(req: any) {
  if (req.body.email) {
    req.body.email = req.body.email.toLowerCase();
  }
  if (req.body.firstName) {
    req.body.firstName = wordChangeTitleCase(req.body.firstName);
  }
  if (req.body.lastName) {
    req.body.lastName = wordChangeTitleCase(req.body.lastName);
  }
  if (req.body.fullName) {
    req.body.fullName = wordChangeTitleCase(req.body.fullName);
  }
  if (req.body.userName) {
    req.body.userName = wordChangeTitleCase(req.body.userName);
  }
  if (req.body.title) {
    req.body.title = wordChangeSentenceCase(req.body.title);
  }
  if (req.body.notes && req.body.notes.length) {
    req.body.notes = req.body.notes.map((note: string) => {
      return wordChangeSentenceCase(note);
    });
  }
  if (req.body.note) {
    req.body.note = wordChangeSentenceCase(req.body.note);
  }
  if (req.body.description) {
    req.body.description = wordChangeSentenceCase(req.body.description);
  }
  if (req.body.dueDate) {
    req.body.dueDate = new Date(req.body.dueDate);
  }
  if (req.body.startDate) {
    req.body.startDate = new Date(req.body.startDate);
  }
  if (req.body.endDate) {
    req.body.endDate = new Date(req.body.endDate);
  }
  return req;
}

function wordChangeTitleCase(word: string) {
  word = word.toLowerCase();
  return word.replace(/(^\w{1})|(\s+\w{1})/g, (letter: string) =>
    letter.toUpperCase()
  );
}

function wordChangeSentenceCase(word: string) {
  word = word.toLowerCase();
  return word.replace(/(^\w|[.!?]\s*\w)/g, (match) => match.toUpperCase());
}
