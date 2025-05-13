create database Animate;

create table Cadastro (
	Id serial not null,
	Email varchar(50) not null,
	Username varchar(25) not null,
	Password varchar(50) not null,
	primary key (id)
);

select * from Cadastro;