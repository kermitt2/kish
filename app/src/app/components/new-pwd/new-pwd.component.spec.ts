import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewPwdComponent } from './new-pwd.component';

describe('NewPwdComponent', () => {
  let component: NewPwdComponent;
  let fixture: ComponentFixture<NewPwdComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NewPwdComponent]
    });
    fixture = TestBed.createComponent(NewPwdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
