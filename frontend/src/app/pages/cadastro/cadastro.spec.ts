import { TestBed } from '@angular/core/testing';
import { Cadastro } from './cadastro';

describe('Cadastro', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cadastro],
    }).compileComponents();
  });

  it('should create the page', () => {
    const fixture = TestBed.createComponent(Cadastro);

    expect(fixture.componentInstance).toBeTruthy();
  });
});
