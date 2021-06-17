import { Pipe, PipeTransform } from '@angular/core';
import { addDays, format, startOfToday } from 'date-fns';

@Pipe({
  name: 'fillDatePlaceholders',
})
export class QuestionnaireFillDatePlaceholdersPipe implements PipeTransform {
  private static readonly DATE_PLACEHOLDER_REGEX = /\(dat=(.*?)\)/g;

  /**
   * Replaces every occurrence of (dat=<number>) with
   * a date relative to the given base date.
   */
  transform(value: string, ...args: [string]): string {
    const baseDate = args[0] ? new Date(args[0]) : startOfToday();
    const regex = new RegExp(
      QuestionnaireFillDatePlaceholdersPipe.DATE_PLACEHOLDER_REGEX
    );

    let result = value || '';
    let match = regex.exec(result);

    while (match !== null) {
      const days = Number(match[1]);
      const replacementDate = format(addDays(baseDate, days), 'dd.MM.yyyy');
      result = result.replace(match[0], replacementDate);
      match = regex.exec(result);
    }
    return result;
  }
}
