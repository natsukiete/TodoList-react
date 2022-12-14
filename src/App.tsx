import { useState, VFC, useEffect } from "react";
import "./styles.css";
import { Box, VStack } from "@chakra-ui/react";
import { useRecoilState } from "recoil";
import { format } from "date-fns";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";

import db from "./firebase";
import { EditForm } from "./components/EditForm";
import { TodoForm } from "./components/TodoForm";
import { FilteringSelect } from "./atoms/FilteringSelect";
import { TodoTable } from "./components/TodoTable";
import { FilteredTable } from "./components/FilteredTable";
import { todosListState } from "./store/recoil/todosListState";
import { progressFilterState } from "./store/recoil/progressFilterState";

export const App: VFC = () => {
  const [todos, setTodos] = useRecoilState(todosListState);
  const [todo, setTodo] = useState({
    id: 0,
    title: "",
    progress: "",
    detail: "",
    createddate: "",
    updateddate: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentTodo, setCurrentTodo] = useState({});
  const [isfilter, setIsFilter] = useState(false);
  const [filter, setFilter] = useRecoilState(progressFilterState);

  //追加 target
  const handleAddInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const target = e.target;
    const value =
      target.name === "progress"
        ? target.selectedOptions[0].text
        : target.value;
    const name = target.name;
    setTodo((prevState) => ({
      ...prevState,
      [name]: value
    }));
  };

  //追加　　配列
  const handleAddFrom = (e) => {
    e.preventDefault();
    console.log(e);
    if (todo !== "") {
      const add = {
        id: todos.length + 1,
        title: todo.title,
        progress: todo.progress,
        detail: todo.detail,
        createddate: format(new Date(), "yyyy年M月d日"),
        updateddate: todo.updateddate
      };
      addDoc(collection(db, "todos"), add);
      setTodos([...todos, add]);
    }
    setTodo({
      id: 0,
      title: "",
      progress: "",
      detail: "",
      createddate: "",
      updateddate: ""
    });
    setFilter("");
  };

  //削除
  const handleDeleteClick = async (id) => {
    const q = query(collection(db, "todos"), where("id", "==", id));

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((ids) => {
      const documentID = ids.id;
      deleteDoc(doc(db, "todos", documentID));

      const removeItem = todos.filter((todo) => {
        return todo.id !== id;
      });
      setTodos(removeItem);
    });
  };

  //編集
  function handleEditInputChange(e) {
    setCurrentTodo({
      ...currentTodo,
      title: e.target.value
    });
  }

  function handleEditSelectedInputChange(e) {
    setCurrentTodo({
      ...currentTodo,
      progress: e.target.selectedOptions[0].textContent
    });
  }

  function handleEditDetailInputChange(e) {
    setCurrentTodo({
      ...currentTodo,
      detail: e.target.value
    });
  }

  function handleEditClick(todo) {
    setIsEditing(true);
    setCurrentTodo({ ...todo });
  }

  const handleUpdateTodo = async (id, updatedTodo) => {
    const q = query(collection(db, "todos"), where("id", "==", id));

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((ids) => {
      const documentID = ids.id;
      const docRef = doc(db, "todos", documentID);

      updateDoc(docRef, {
        updateddate: serverTimestamp()
      });
    });

    const updatedItem = todos.map((todo) => {
      return todo.id === id ? updatedTodo : todo;
    });
    setIsEditing(false);
    setTodos(updatedItem);
  };
  function handleEditFormSubmit(e) {
    e.preventDefault();
    handleUpdateTodo(currentTodo.id, currentTodo);
  }
  function handleSelectedProgress(e) {
    setIsFilter(true);
    setFilter(e.target.value);
  }

  //一覧表示
  useEffect(() => {
    const postData = query(collection(db, "todos"), orderBy("id"));
    getDocs(postData).then((snapShot) => {
      setTodos(snapShot.docs.map((doc) => ({ ...doc.data() })));
    });
  }, [setTodos]);

  return (
    <>
      <VStack>
        {isEditing ? (
          <EditForm
            currentTodo={currentTodo}
            onEditFormSubmit={handleEditFormSubmit}
            onEditInputChange={handleEditInputChange}
            onEditSelectedInputChange={handleEditSelectedInputChange}
            onEditDetailInputChange={handleEditDetailInputChange}
            setIsEditing={setIsEditing}
          />
        ) : (
          <TodoForm
            handleAddFrom={handleAddFrom}
            todo={todo}
            handleAddInputChange={handleAddInputChange}
          />
        )}
        <Box>
          <FilteringSelect
            id="filter"
            name="filter"
            value={filter}
            onChange={handleSelectedProgress}
          />
        </Box>
        {isfilter ? (
          <>
            <FilteredTable
              todo={todo}
              handleEditClick={handleEditClick}
              handleDeleteClick={handleDeleteClick}
            />
          </>
        ) : (
          <>
            <TodoTable
              todos={todos}
              todo={todo}
              handleEditClick={handleEditClick}
              handleDeleteClick={handleDeleteClick}
            />
          </>
        )}
      </VStack>
    </>
  );
};
