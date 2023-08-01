import React, { useEffect, useMemo, useState } from 'react';
import { UserWarning } from './UserWarning';
import { Todo } from './types/Todo';
import { ErrorType } from './types/Errors';
import * as TodoServices from './api/todos';
import { FilterType } from './types/FilterType';
import { getPreparedTodos } from './utils/filterFunction';
import { TodoList } from './Components/TodoList';
import { TodoFooter } from './Components/TodoFooter';
import { TodoHeader } from './Components/TodoHeader';
import { ErrorNotification } from './Components/ErrorsNotification';

const USER_ID = 11128;

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<ErrorType>(ErrorType.none);
  const [filterType, setFilterType] = useState(FilterType.All);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingId, setLoadingId] = useState<number[]>([]);

  const visibleTodos = useMemo(
    () => getPreparedTodos(todos, filterType),
    [todos, filterType],
  );

  const complitedTodods = useMemo(
    () => todos.every(todo => todo.completed), [todos],
  );

  useEffect(() => {
    TodoServices.getTodos(USER_ID)
      .then(setTodos)
      .catch(() => {
        setError(ErrorType.getData);
      });
  }, []);

  const handleAddTodo = ({ title, completed, userId }: Todo) => {
    setLoading(true);

    return TodoServices.createTodo({ title, completed, userId })
      .then(newTodo => {
        setTodos(currentTodos => [...currentTodos, newTodo]);
      })
      .catch((newError) => {
        throw newError;
      })
      .finally(() => setLoading(false));
  };

  const handleUpdateTodo = (todoId: number, data: Partial<Todo>) => {
    setLoadingId(curId => [todoId, ...curId]);

    return TodoServices.updateTodo(todoId, data)
      .then(todo => {
        setTodos(currentTodos => {
          const newTodos = [...currentTodos];
          const index = newTodos.findIndex(t => t.id === todoId);

          newTodos.splice(index, 1, todo);

          return newTodos;
        });
      })
      .catch((newError) => {
        setError(ErrorType.updateTodo);
        throw newError;
      })
      .finally(() => setLoadingId([]));
  };

  const hanldeDeleteTodo = (todoId:number) => {
    setLoadingId(curId => [todoId, ...curId]);

    return TodoServices.deleteTodo(todoId)
      .then(() => {
        setTodos(currentTodo => currentTodo.filter(todo => todo.id !== todoId));
      })
      .catch((newError) => {
        setError(ErrorType.deleteTodo);
        throw newError;
      })
      .finally(() => {
        setLoadingId([]);
      });
  };

  const handleToogleStatus = () => {
    if (complitedTodods) {
      todos.forEach(
        todo => handleUpdateTodo(todo.id, { completed: !todo.completed }),
      );
    } else {
      todos
        .filter(todo => !todo.completed)
        .forEach(
          todo => handleUpdateTodo(todo.id, { completed: !todo.completed }),
        );
    }
  };

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">

        <TodoHeader
          todos={todos}
          addTodo={handleAddTodo}
          setError={setError}
          setTempTodo={setTempTodo}
          handleToogleStatus={handleToogleStatus}
        />

        <TodoList
          isLoading={loading}
          tempTodo={tempTodo}
          visibleTodos={visibleTodos}
          onDeleteTodo={hanldeDeleteTodo}
          loadingId={loadingId}
          onUpdateTodo={handleUpdateTodo}
        />

        {todos.length > 0 && (
          <TodoFooter
            todos={todos}
            filterType={filterType}
            setFilterType={setFilterType}
            hanldeDeleteTodo={hanldeDeleteTodo}
          />
        )}

      </div>
      <ErrorNotification
        errorMessage={error}
        closeError={setError}
      />
    </div>
  );
};
