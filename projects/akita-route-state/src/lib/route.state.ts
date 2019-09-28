import { Injectable } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Data, NavigationEnd, ParamMap, Params, Router } from '@angular/router';
import { createQuery, createStore } from '@datorama/akita';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface RouteStateData {
  data: Data;
  queryParamMap: ParamMap;
  queryParams: Params;
  paramMap: ParamMap;
  params: Params;
  url: string;
}

function createInitialState(): RouteStateData {
  return {
    data: {},
    queryParamMap: convertToParamMap({}),
    queryParams: {},
    paramMap: convertToParamMap({}),
    params: {},
    url: '',
  };
}

@Injectable({ providedIn: 'root' })
export class RouteState {
  private store = createStore<RouteStateData>(createInitialState(), { name: 'router' });
  private query = createQuery<RouteStateData>(this.store);
  private navigationSubscription = this.handleNavigationEnd();

  constructor(
    private router: Router,
  ) { }

  private handleNavigationEnd(): Subscription {
    const navigationEnd$ = this.router.events.pipe(
      filter(event => NavigationEnd === event.constructor),
    );

    return navigationEnd$.subscribe(() => {
      const root: ActivatedRoute = this.router.routerState.root;
      const { queryParamMap, queryParams } = root.snapshot;
      const [data, params] = this.collectDataAndParams(root);
      const paramMap = convertToParamMap(params);
      this.store.update({
        data,
        queryParamMap,
        queryParams,
        paramMap,
        params,
        url: this.router.url,
      });
    });
  }

  private collectDataAndParams(root: ActivatedRoute): [Data, Params] {
    let { snapshot } = root;
    let data = { ...snapshot.data };
    let params = { ...snapshot.params };
    while (snapshot.firstChild) {
      snapshot = snapshot.firstChild;
      data = { ...data, ...snapshot.data };
      params = { ...params, ...snapshot.params };
    }
    return [data, params];
  }

  public select(arg?) {
    return this.query.select(arg).pipe(filter(() => !!this.query.getValue().url));
  }

  public selectData(): Observable<Data> {
    return this.select(state => state.data);
  }

  public selectQueryParamMap(): Observable<Params> {
    return this.select(state => state.queryParamMap);
  }

  public selectQueryParam<T = string>(
    name: string,
    castFn: (v: string) => T = (v: string): T => v as any,
  ): Observable<T> {
    return this.select(state => castFn(state.queryParamMap.get(name)));
  }

  public selectParams(): Observable<Params> {
    return this.select(state => state.paramMap);
  }

  public selectParam<T = string>(
    name: string,
    castFn: (v: string) => T = (v: string): T => v as any,
  ): Observable<T> {
    return this.select(state => castFn(state.paramMap.get(name)));
  }

  public selectUrl() {
    return this.select(state => state.url);
  }

  public getValue(): RouteStateData {
    return this.query.getValue();
  }

  public destroy() {
    this.store.destroy();
    this.navigationSubscription.unsubscribe();
  }
}

