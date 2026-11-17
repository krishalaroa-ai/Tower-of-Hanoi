:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_json)).
:- use_module(library(http/http_files)).
:- http_handler(root(api/health), health_handler, []).
:- http_handler(root(api/solve), solve_handler, [method(post)]).
:- http_handler(root(.), static_handler, [prefix]).
:- initialization(main, main).
main :- http_server(http_dispatch, [port(8080)]), format('Tower of Hanoi: http://localhost:8080~n', []), thread_get_message(_).
health_handler(_) :- reply_json_dict(_{status:"ok",backend:"SWI-Prolog"}).
solve_handler(Request) :-
    http_read_json_dict(Request, Input),
    ( get_dict(disks, Input, N), integer(N), between(1,10,N)
    -> hanoi_moves(N,left,right,middle,Moves), maplist(move_dict,Moves,Dicts), length(Dicts,Total),
       reply_json_dict(_{disks:N,total_moves:Total,moves:Dicts})
    ; reply_json_dict(_{error:"The number of disks must be an integer from 1 to 10"},[status(400)]) ).
move_dict(move(D,F,T),_{disk:D,from:F,to:T}).
hanoi_moves(0,_,_,_,[]) :- !.
hanoi_moves(N,F,T,A,Moves) :- N>0, N1 is N-1, hanoi_moves(N1,F,A,T,First), hanoi_moves(N1,A,T,F,Last), append(First,[move(N,F,T)|Last],Moves).
static_handler(Request) :- http_reply_from_files('public',[indexes(['index.html'])],Request).
