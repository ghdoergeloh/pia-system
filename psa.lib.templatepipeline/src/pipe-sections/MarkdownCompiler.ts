import { PipeSection } from './PipeSection';
import { parse } from 'marked';
import { HtmlDocument, MarkdownDocument } from '../template-documents';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const window = new JSDOM('').window as unknown;

// @types/dompurify does not jet support @types/jsdom
const domPurify = DOMPurify(window as Window);

export class MarkdownCompiler
  implements PipeSection<MarkdownDocument, HtmlDocument>
{
  public allowedTags: string[];

  public constructor(tags: string[]) {
    this.allowedTags = tags;
  }

  public execute(input: MarkdownDocument): HtmlDocument {
    return new HtmlDocument(this.parseMarkdown(input.markdownText));
  }

  private async parseMarkdown(markdownText: Promise<string>): Promise<string> {
    return parse(
      domPurify.sanitize(await markdownText, {
        ADD_TAGS: this.allowedTags,
      })
    );
  }
}
