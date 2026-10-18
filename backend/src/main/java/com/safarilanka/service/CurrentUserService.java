package com.safarilanka.service;
import com.safarilanka.model.User; import com.safarilanka.repository.UserRepository; import org.springframework.security.core.Authentication; import org.springframework.stereotype.Service;
@Service public class CurrentUserService { private final UserRepository repo; public CurrentUserService(UserRepository r){repo=r;} public User get(Authentication a){return repo.findByEmailIgnoreCase(a.getName()).orElseThrow(()->new IllegalArgumentException("Authenticated user not found"));} }
