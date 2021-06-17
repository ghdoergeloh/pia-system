import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { QuestionnaireAnswerSingleSelectComponent } from './questionnaire-answer-single-select.component';

describe('QuestionnaireAnswerSingleSelectComponent', () => {
  let component: QuestionnaireAnswerSingleSelectComponent;
  let fixture: ComponentFixture<QuestionnaireAnswerSingleSelectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [QuestionnaireAnswerSingleSelectComponent],
      imports: [IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionnaireAnswerSingleSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
