import { TestBed } from '@angular/core/testing';

import { RouteState } from './route.state';

describe('RouteState', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RouteState = TestBed.get(RouteState);
    expect(service).toBeTruthy();
  });
});
