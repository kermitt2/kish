import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentAnnotationComponent } from './document-annotation.component';

describe('DocumentAnnotationComponent', () => {
  let component: DocumentAnnotationComponent;
  let fixture: ComponentFixture<DocumentAnnotationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DocumentAnnotationComponent]
    });
    fixture = TestBed.createComponent(DocumentAnnotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
